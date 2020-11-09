import { h, Component } from 'preact';

import * as style from './style.css';
import 'add-css:./style.css';
import {
  blobToImg,
  drawableToImageData,
  blobToText,
  builtinDecode,
  sniffMimeType,
  canDecodeImageType,
  abortable,
  assertSignal,
} from '../util';
import {
  PreprocessorState,
  ProcessorState,
  EncoderState,
  encoderMap,
  defaultPreprocessorState,
  defaultProcessorState,
  EncoderType,
  EncoderOptions,
} from '../feature-meta';
import Output from '../Output';
import Options from '../Options';
import ResultCache from './result-cache';
import { cleanMerge, cleanSet } from '../util/clean-modify';
import './custom-els/MultiPanel';
import Results from '../results';
import { ExpandIcon, CopyAcrossIconProps } from '../../lib/icons';
import SnackBarElement from '../../lib/SnackBar';
import WorkerBridge from '../worker-bridge';
import { resize } from 'features/processors/resize/client';

type OutputType = EncoderType | 'identity';

export interface SourceImage {
  file: File;
  decoded: ImageData;
  processed: ImageData;
  vectorImage?: HTMLImageElement;
}

interface SideSettings {
  processorState: ProcessorState;
  encoderState?: EncoderState;
}

interface Side {
  processed?: ImageData;
  file?: File;
  downloadUrl?: string;
  data?: ImageData;
  latestSettings: SideSettings;
  encodedSettings?: SideSettings;
  loading: boolean;
}

interface Props {
  file: File;
  showSnack: SnackBarElement['showSnackbar'];
  onBack: () => void;
}

interface State {
  source?: SourceImage;
  sides: [Side, Side];
  /** Source image load */
  loading: boolean;
  error?: string;
  mobileView: boolean;
  preprocessorState: PreprocessorState;
  encodedPreprocessorState?: PreprocessorState;
}

interface UpdateImageOptions {
  skipPreprocessing?: boolean;
}

interface MainJob {
  file: File;
  preprocessorState: PreprocessorState;
}

interface SideJob {
  processorState: ProcessorState;
  encoderState?: EncoderState;
}

async function decodeImage(
  signal: AbortSignal,
  blob: Blob,
  workerBridge: WorkerBridge,
): Promise<ImageData> {
  assertSignal(signal);
  const mimeType = await abortable(signal, sniffMimeType(blob));
  const canDecode = await abortable(signal, canDecodeImageType(mimeType));

  try {
    if (!canDecode) {
      if (mimeType === 'image/avif') {
        return await workerBridge.avifDecode(signal, blob);
      }
      if (mimeType === 'image/webp') {
        return await workerBridge.webpDecode(signal, blob);
      }
      // If it's not one of those types, fall through and try built-in decoding for a laugh.
    }
    return await abortable(signal, builtinDecode(blob));
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    console.log(err);
    throw Error("Couldn't decode image");
  }
}

async function preprocessImage(
  signal: AbortSignal,
  data: ImageData,
  preprocessorState: PreprocessorState,
  workerBridge: WorkerBridge,
): Promise<ImageData> {
  assertSignal(signal);
  let processedData = data;

  if (preprocessorState.rotate.rotate !== 0) {
    processedData = await workerBridge.rotate(
      signal,
      processedData,
      preprocessorState.rotate,
    );
  }

  return processedData;
}

async function processImage(
  signal: AbortSignal,
  source: SourceImage,
  processorState: ProcessorState,
  workerBridge: WorkerBridge,
): Promise<ImageData> {
  assertSignal(signal);
  let result = source.processed;

  if (processorState.resize.enabled) {
    result = await resize(signal, source, processorState.resize, workerBridge);
  }
  if (processorState.quantize.enabled) {
    result = await workerBridge.quantize(
      signal,
      result,
      processorState.quantize,
    );
  }
  return result;
}

async function compressImage(
  signal: AbortSignal,
  image: ImageData,
  encodeData: EncoderState,
  sourceFilename: string,
  workerBridge: WorkerBridge,
): Promise<File> {
  assertSignal(signal);

  const encoder = encoderMap[encodeData.type];
  const compressedData = await encoder.encode(
    signal,
    workerBridge,
    image,
    // The type of encodeData.options is enforced via the previous line
    encodeData.options as any,
  );

  return new File(
    [compressedData],
    sourceFilename.replace(/.[^.]*$/, `.${encoder.meta.extension}`),
    { type: encoder.meta.mimeType },
  );
}

function stateForNewSourceData(state: State): State {
  let newState = { ...state };

  for (const i of [0, 1]) {
    // Ditch previous encodings
    const downloadUrl = state.sides[i].downloadUrl;
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);

    newState = cleanMerge(state, `sides.${i}`, {
      preprocessed: undefined,
      file: undefined,
      downloadUrl: undefined,
      data: undefined,
      encodedSettings: undefined,
    });
  }

  return newState;
}

async function processSvg(
  signal: AbortSignal,
  blob: Blob,
): Promise<HTMLImageElement> {
  assertSignal(signal);
  // Firefox throws if you try to draw an SVG to canvas that doesn't have width/height.
  // In Chrome it loads, but drawImage behaves weirdly.
  // This function sets width/height if it isn't already set.
  const parser = new DOMParser();
  const text = await abortable(signal, blobToText(blob));
  const document = parser.parseFromString(text, 'image/svg+xml');
  const svg = document.documentElement!;

  if (svg.hasAttribute('width') && svg.hasAttribute('height')) {
    return blobToImg(blob);
  }

  const viewBox = svg.getAttribute('viewBox');
  if (viewBox === null) throw Error('SVG must have width/height or viewBox');

  const viewboxParts = viewBox.split(/\s+/);
  svg.setAttribute('width', viewboxParts[2]);
  svg.setAttribute('height', viewboxParts[3]);

  const serializer = new XMLSerializer();
  const newSource = serializer.serializeToString(document);
  return abortable(
    signal,
    blobToImg(new Blob([newSource], { type: 'image/svg+xml' })),
  );
}

// These are only used in the mobile view
const resultTitles = ['Top', 'Bottom'] as const;
// These are only used in the desktop view
const buttonPositions = ['download-left', 'download-right'] as const;

const originalDocumentTitle = document.title;

function updateDocumentTitle(filename: string = ''): void {
  document.title = filename
    ? `${filename} - ${originalDocumentTitle}`
    : originalDocumentTitle;
}

export default class Compress extends Component<Props, State> {
  widthQuery = window.matchMedia('(max-width: 599px)');

  state: State = {
    source: undefined,
    loading: false,
    sides: [
      {
        latestSettings: {
          processorState: defaultProcessorState,
          encoderState: undefined,
        },
        loading: false,
      },
      {
        latestSettings: {
          processorState: defaultProcessorState,
          encoderState: {
            type: 'mozJPEG',
            options: encoderMap.mozJPEG.meta.defaultOptions,
          },
        },
        loading: false,
      },
    ],
    mobileView: this.widthQuery.matches,
  };

  private readonly encodeCache = new ResultCache();
  // One for each side
  private readonly workerBridges = [new WorkerBridge(), new WorkerBridge()];
  /** Abort controller for actions that impact both sites, like source image decoding and preprocessing */
  private mainAbortController = new AbortController();
  // And again one for each side
  private sideAbortControllers = [new AbortController(), new AbortController()];

  // For debouncing calls to updateImage for each side.
  private readonly updateImageTimeoutIds: [number?, number?] = [
    undefined,
    undefined,
  ];

  constructor(props: Props) {
    super(props);
    this.widthQuery.addListener(this.onMobileWidthChange);
    this.sourceFile = props.file;
    this.updateJob(
      props.file,
      defaultPreprocessorState,
      this.state.sides.map((side) => side.latestSettings.processorState) as [
        ProcessorState,
        ProcessorState,
      ],
      this.state.sides.map((side) => side.latestSettings.encoderState) as [
        EncoderState,
        EncoderState,
      ],
    );

    import('../sw-bridge').then(({ mainAppLoaded }) => mainAppLoaded());
  }

  private onMobileWidthChange = () => {
    this.setState({ mobileView: this.widthQuery.matches });
  };

  private onEncoderTypeChange(index: 0 | 1, newType: OutputType): void {
    this.setState({
      sides: cleanSet(
        this.state.sides,
        `${index}.latestSettings.encoderState`,
        newType === 'identity'
          ? undefined
          : {
              type: newType,
              options: encoderMap[newType].meta.defaultOptions,
            },
      ),
    });
  }

  private onProcessorOptionsChange(
    index: 0 | 1,
    options: ProcessorState,
  ): void {
    this.setState({
      sides: cleanSet(
        this.state.sides,
        `${index}.latestSettings.processorState`,
        options,
      ),
    });
  }

  private onEncoderOptionsChange(index: 0 | 1, options: EncoderOptions): void {
    this.setState({
      sides: cleanSet(
        this.state.sides,
        `${index}.latestSettings.encoderState.options`,
        options,
      ),
    });
  }

  componentWillReceiveProps(nextProps: Props): void {
    if (nextProps.file !== this.props.file) {
      this.updateFile(nextProps.file);
    }
  }

  componentWillUnmount(): void {
    updateDocumentTitle();
  }

  componentDidUpdate(prevProps: Props, prevState: State): void {
    const { source, sides } = this.state;

    const sourceDataChanged =
      // Has the source object become set/unset?
      !!source !== !!prevState.source ||
      // Or has the processed data changed?
      (source &&
        prevState.source &&
        source.processed !== prevState.source.processed);

    for (const [i, side] of sides.entries()) {
      const prevSettings = prevState.sides[i].latestSettings;
      const encoderChanged =
        side.latestSettings.encoderState !== prevSettings.encoderState;
      const preprocessorChanged =
        side.latestSettings.processorState !== prevSettings.processorState;

      // The image only needs updated if the encoder/preprocessor settings have changed, or the
      // source has changed.
      if (sourceDataChanged || encoderChanged || preprocessorChanged) {
        this.queueUpdateImage(i, {
          skipPreprocessing: !sourceDataChanged && !preprocessorChanged,
        });
      }
    }
  }

  private async onCopyToOtherClick(index: 0 | 1) {
    const otherIndex = index ? 0 : 1;
    const oldSettings = this.state.sides[otherIndex];
    const newSettings = { ...this.state.sides[index] };

    // Create a new object URL for the new settings. This avoids both sides sharing a URL, which
    // means it can be safely revoked without impacting the other side.
    if (newSettings.file) {
      newSettings.downloadUrl = URL.createObjectURL(newSettings.file);
    }

    this.setState({
      sides: cleanSet(this.state.sides, otherIndex, newSettings),
    });

    const result = await this.props.showSnack('Settings copied across', {
      timeout: 5000,
      actions: ['undo', 'dismiss'],
    });

    if (result !== 'undo') return;

    this.setState({
      sides: cleanSet(this.state.sides, otherIndex, oldSettings),
    });
  }

  private onPreprocessorChange = async (
    options: PreprocessorState,
  ): Promise<void> => {
    const source = this.state.source;
    if (!source) return;

    const oldRotate = source.preprocessorState.rotate.rotate;
    const newRotate = options.rotate.rotate;
    const orientationChanged = oldRotate % 180 !== newRotate % 180;
    // Either worker bridge is good enough here.
    const workerBridge = this.workerBridges[0];

    // Abort any current jobs, as they're redundant now.
    for (const controller of [
      this.mainAbortController,
      ...this.sideAbortControllers,
    ]) {
      controller.abort();
    }

    this.mainAbortController = new AbortController();
    const { signal } = this.mainAbortController;

    this.setState({
      loading: true,
      // TODO: this is wrong
      source: cleanSet(source, 'inputProcessorState', options),
    });

    try {
      const processed = await preprocessImage(
        signal,
        source.decoded,
        options,
        workerBridge,
      );

      let newState = { ...this.state, loading: false };
      newState = cleanSet(newState, 'source.processed', processed);
      newState = stateForNewSourceData(newState);

      if (orientationChanged) {
        // If orientation has changed, we should flip the resize values.
        for (const i of [0, 1]) {
          const resizeSettings =
            newState.sides[i].latestSettings.processorState.resize;
          newState = cleanMerge(
            newState,
            `sides.${i}.latestSettings.processorState.resize`,
            {
              width: resizeSettings.height,
              height: resizeSettings.width,
            },
          );
        }
      }
      this.setState(newState);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error(err);
      this.props.showSnack('Processing error');
      this.setState({ loading: false });
    }
  };

  private updateFile = async (file: File) => {
    // Either processor is good enough here.
    const workerBridge = this.workerBridges[0];

    this.setState({ loading: true });

    // Abort any current jobs, as they're redundant now.
    for (const controller of [
      this.mainAbortController,
      ...this.sideAbortControllers,
    ]) {
      controller.abort();
    }

    this.mainAbortController = new AbortController();
    const { signal } = this.mainAbortController;

    try {
      let decoded: ImageData;
      let vectorImage: HTMLImageElement | undefined;

      // Special-case SVG. We need to avoid createImageBitmap because of
      // https://bugs.chromium.org/p/chromium/issues/detail?id=606319.
      // Also, we cache the HTMLImageElement so we can perform vector resizing later.
      if (file.type.startsWith('image/svg+xml')) {
        vectorImage = await processSvg(signal, file);
        decoded = drawableToImageData(vectorImage);
      } else {
        // Either processor is good enough here.
        decoded = await decodeImage(signal, file, workerBridge);
      }

      const processed = await preprocessImage(
        signal,
        decoded,
        defaultPreprocessorState,
        workerBridge,
      );

      let newState: State = {
        ...this.state,
        source: {
          decoded,
          file,
          vectorImage,
          processed,
          preprocessorState: defaultPreprocessorState,
        },
        loading: false,
      };

      newState = stateForNewSourceData(newState);

      for (const i of [0, 1]) {
        // Default resize values come from the image:
        newState = cleanMerge(
          newState,
          `sides.${i}.latestSettings.processorState.resize`,
          {
            width: processed.width,
            height: processed.height,
            method: vectorImage ? 'vector' : 'lanczos3',
          },
        );
      }

      updateDocumentTitle(file.name);
      this.setState(newState);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error(err);
      this.props.showSnack('Invalid image');
      this.setState({ loading: false });
    }
  };

  /**
   * Debounce the heavy lifting of updateImage.
   * Otherwise, the thrashing causes jank, and sometimes crashes iOS Safari.
   */
  private queueUpdateImage(
    index: number,
    options: UpdateImageOptions = {},
  ): void {
    // Call updateImage after this delay, unless queueUpdateImage is called again, in which case the
    // timeout is reset.
    const delay = 100;

    clearTimeout(this.updateImageTimeoutIds[index]);

    this.updateImageTimeoutIds[index] = self.setTimeout(() => {
      this.updateImage(index, options).catch((err) => {
        console.error(err);
      });
    }, delay);
  }

  private async updateImage(
    index: number,
    options: UpdateImageOptions = {},
  ): Promise<void> {
    const { skipPreprocessing } = options;
    const { source } = this.state;
    if (!source) return;

    // Abort any current tasks on this side
    this.sideAbortControllers[index].abort();
    this.sideAbortControllers[index] = new AbortController();
    const { signal } = this.sideAbortControllers[index];

    let sides = cleanMerge(this.state.sides, index, {
      loading: true,
    });

    this.setState({ sides });

    const side = sides[index];
    const settings = side.latestSettings;

    let file: File | undefined;
    let preprocessed: ImageData | undefined;
    let data: ImageData | undefined;

    const workerBridge = this.workerBridges[index];

    try {
      if (!settings.encoderState) {
        // Original image
        file = source.file;
        data = source.processed;
      } else {
        const cacheResult = this.encodeCache.match(
          source.processed,
          settings.processorState,
          settings.encoderState,
        );

        if (cacheResult) {
          ({ file, preprocessed, data } = cacheResult);
        } else {
          preprocessed =
            skipPreprocessing && side.processed
              ? side.processed
              : await processImage(
                  signal,
                  source,
                  settings.processorState,
                  workerBridge,
                );

          file = await compressImage(
            signal,
            preprocessed,
            settings.encoderState,
            source.file.name,
            workerBridge,
          );
          data = await decodeImage(signal, file, workerBridge);

          this.encodeCache.add({
            data,
            preprocessed,
            file,
            sourceData: source.processed,
            encoderState: settings.encoderState,
            processorState: settings.processorState,
          });
          assertSignal(signal);
        }
      }

      const latestData = this.state.sides[index];
      if (latestData.downloadUrl) URL.revokeObjectURL(latestData.downloadUrl);

      assertSignal(signal);

      sides = cleanMerge(this.state.sides, index, {
        file,
        data,
        preprocessed,
        downloadUrl: URL.createObjectURL(file),
        loading: false,
        encodedSettings: settings,
      });

      this.setState({ sides });
    } catch (err) {
      if (err.name === 'AbortError') return;
      this.props.showSnack(`Processing error: ${err}`);
      throw err;
    }
  }

  private sourceFile: File;
  /** The in-progress job for decoding and preprocessing */
  private activeMainJob?: MainJob;
  /** The in-progress job for each side (processing and encoding) */
  private activeSideJobs: [SideJob?, SideJob?] = [undefined, undefined];

  private async updateJob() {
    const currentState = this.state;

    // State of the last completed job, or ongoing job
    const latestMainJobState: Partial<MainJob> = this.activeMainJob || {
      file: currentState.source && currentState.source.file,
      preprocessorState: currentState.encodedPreprocessorState,
    };
    const latestSideJobStates: Partial<SideJob>[] = currentState.sides.map(
      (side, i) =>
        this.activeSideJobs[i] || {
          processorState:
            side.encodedSettings && side.encodedSettings.processorState,
          encoderState:
            side.encodedSettings && side.encodedSettings.encoderState,
        },
    );

    // State for this job
    const mainJobState: MainJob = {
      file: this.sourceFile,
      preprocessorState: currentState.preprocessorState,
    };
    const sideJobStates: SideJob[] = currentState.sides.map((side) => ({
      processorState: side.latestSettings.processorState,
      encoderState: side.latestSettings.encoderState,
    }));

    // Figure out what needs doing:
    const needsDecoding = latestMainJobState.file != mainJobState.file;
    const needsPreprocessing =
      needsDecoding ||
      latestMainJobState.preprocessorState !== mainJobState.preprocessorState;
    const sideWorksNeeded = latestSideJobStates.map((latestSideJob, i) => ({
      processing:
        needsPreprocessing ||
        latestSideJob.processorState !== sideJobStates[i].processorState,
      encoding:
        needsPreprocessing ||
        latestSideJob.encoderState !== sideJobStates[i].encoderState,
    }));

    let jobNeeded = false;

    // Abort running tasks & cycle the controllers
    if (needsDecoding || needsPreprocessing) {
      this.mainAbortController.abort();
      this.mainAbortController = new AbortController();
      jobNeeded = true;
      this.activeMainJob = mainJobState;
    }
    for (const [i, sideWorkNeeded] of sideWorksNeeded.entries()) {
      if (sideWorkNeeded.processing || sideWorkNeeded.encoding) {
        this.sideAbortControllers[i].abort();
        this.sideAbortControllers[i] = new AbortController();
        jobNeeded = true;
        this.activeSideJobs[i] = sideJobStates[i];
      }
    }

    if (!jobNeeded) return;

    const mainSignal = this.mainAbortController.signal;
    const sideSignals = this.sideAbortControllers.map((ac) => ac.signal);

    let decoded: ImageData;
    let vectorImage: HTMLImageElement | undefined;

    if (needsDecoding) {
      assertSignal(mainSignal);
      this.setState({
        source: undefined,
        loading: true,
      });

      // Special-case SVG. We need to avoid createImageBitmap because of
      // https://bugs.chromium.org/p/chromium/issues/detail?id=606319.
      // Also, we cache the HTMLImageElement so we can perform vector resizing later.
      if (mainJobState.file.type.startsWith('image/svg+xml')) {
        vectorImage = await processSvg(mainSignal, mainJobState.file);
        decoded = drawableToImageData(vectorImage);
      } else {
        decoded = await decodeImage(
          mainSignal,
          mainJobState.file,
          // Either worker is good enough here.
          this.workerBridges[0],
        );
      }
    } else {
      ({ decoded, vectorImage } = currentState.source!);
    }

    if (needsPreprocessing) {
      assertSignal(mainSignal);
      this.setState({
        loading: true,
      });

      const processed = await preprocessImage(
        mainSignal,
        decoded,
        mainJobState.preprocessorState,
        // Either worker is good enough here.
        this.workerBridges[0],
      );

      let newState: State = {
        ...currentState,
        loading: false,
        source: {
          decoded,
          vectorImage,
          processed,
          file: mainJobState.file,
        },
      };
      newState = stateForNewSourceData(newState);
      this.setState(newState);
    }

    this.activeMainJob = undefined;

    // TODO: you are here. Fork for each side. Perform processing and encoding.
  }

  render({ onBack }: Props, { loading, sides, source, mobileView }: State) {
    const [leftSide, rightSide] = sides;
    const [leftImageData, rightImageData] = sides.map((i) => i.data);

    const options = sides.map((side, index) => (
      // tslint:disable-next-line:jsx-key
      <Options
        source={source}
        mobileView={mobileView}
        preprocessorState={side.latestSettings.processorState}
        encoderState={side.latestSettings.encoderState}
        onEncoderTypeChange={this.onEncoderTypeChange.bind(
          this,
          index as 0 | 1,
        )}
        onEncoderOptionsChange={this.onEncoderOptionsChange.bind(
          this,
          index as 0 | 1,
        )}
        onPreprocessorOptionsChange={this.onProcessorOptionsChange.bind(
          this,
          index as 0 | 1,
        )}
      />
    ));

    const copyDirections = (mobileView
      ? ['down', 'up']
      : ['right', 'left']) as CopyAcrossIconProps['copyDirection'][];

    const results = sides.map((side, index) => (
      // tslint:disable-next-line:jsx-key
      <Results
        downloadUrl={side.downloadUrl}
        imageFile={side.file}
        source={source}
        loading={loading || side.loading}
        copyDirection={copyDirections[index]}
        onCopyToOtherClick={this.onCopyToOtherClick.bind(this, index as 0 | 1)}
        buttonPosition={mobileView ? 'stack-right' : buttonPositions[index]}
      >
        {!mobileView
          ? null
          : [
              <ExpandIcon class={style.expandIcon} key="expand-icon" />,
              `${resultTitles[index]} (${
                encoderMap[side.latestSettings.encoderState.type].label
              })`,
            ]}
      </Results>
    ));

    // For rendering, we ideally want the settings that were used to create the data, not the latest
    // settings.
    const leftDisplaySettings =
      leftSide.encodedSettings || leftSide.latestSettings;
    const rightDisplaySettings =
      rightSide.encodedSettings || rightSide.latestSettings;
    const leftImgContain =
      leftDisplaySettings.processorState.resize.enabled &&
      leftDisplaySettings.processorState.resize.fitMethod === 'contain';
    const rightImgContain =
      rightDisplaySettings.processorState.resize.enabled &&
      rightDisplaySettings.processorState.resize.fitMethod === 'contain';

    return (
      <div class={style.compress}>
        <Output
          source={source}
          mobileView={mobileView}
          leftCompressed={leftImageData}
          rightCompressed={rightImageData}
          leftImgContain={leftImgContain}
          rightImgContain={rightImgContain}
          onBack={onBack}
          inputProcessorState={source && source.preprocessorState}
          onInputProcessorChange={this.onPreprocessorChange}
        />
        {mobileView ? (
          <div class={style.options}>
            <multi-panel class={style.multiPanel} open-one-only>
              {results[0]}
              {options[0]}
              {results[1]}
              {options[1]}
            </multi-panel>
          </div>
        ) : (
          [
            <div class={style.options} key="options0">
              {options[0]}
              {results[0]}
            </div>,
            <div class={style.options} key="options1">
              {options[1]}
              {results[1]}
            </div>,
          ]
        )}
      </div>
    );
  }
}
