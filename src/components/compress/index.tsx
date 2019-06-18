import { h, Component } from 'preact';

import { bind, Fileish } from '../../lib/initial-util';
import { blobToImg, drawableToImageData, blobToText } from '../../lib/util';
import * as style from './style.scss';
import Output from '../Output';
import Options from '../Options';
import ResultCache from './result-cache';
import * as identity from '../../codecs/identity/encoder-meta';
import * as optiPNG from '../../codecs/optipng/encoder-meta';
import * as mozJPEG from '../../codecs/mozjpeg/encoder-meta';
import * as webP from '../../codecs/webp/encoder-meta';
import * as browserPNG from '../../codecs/browser-png/encoder-meta';
import * as browserJPEG from '../../codecs/browser-jpeg/encoder-meta';
import * as browserWebP from '../../codecs/browser-webp/encoder-meta';
import * as browserGIF from '../../codecs/browser-gif/encoder-meta';
import * as browserTIFF from '../../codecs/browser-tiff/encoder-meta';
import * as browserJP2 from '../../codecs/browser-jp2/encoder-meta';
import * as browserBMP from '../../codecs/browser-bmp/encoder-meta';
import * as browserPDF from '../../codecs/browser-pdf/encoder-meta';
import { EncoderState, EncoderType, EncoderOptions, encoderMap } from '../../codecs/encoders';
import { PreprocessorState, defaultPreprocessorState } from '../../codecs/preprocessors';
import { decodeImage } from '../../codecs/decoders';
import { cleanMerge, cleanSet } from '../../lib/clean-modify';
import Processor from '../../codecs/processor';
import {
  BrowserResizeOptions, isWorkerOptions as isWorkerResizeOptions, isHqx, WorkerResizeOptions,
} from '../../codecs/resize/processor-meta';
import './custom-els/MultiPanel';
import Results from '../results';
import { ExpandIcon, CopyAcrossIconProps } from '../../lib/icons';
import SnackBarElement from '../../lib/SnackBar';
import { InputProcessorState, defaultInputProcessorState } from '../../codecs/input-processors';

export interface SourceImage {
  file: File | Fileish;
  decoded: ImageData;
  processed: ImageData;
  vectorImage?: HTMLImageElement;
  inputProcessorState: InputProcessorState;
}

interface SideSettings {
  preprocessorState: PreprocessorState;
  encoderState: EncoderState;
}

interface Side {
  preprocessed?: ImageData;
  file?: Fileish;
  downloadUrl?: string;
  data?: ImageData;
  latestSettings: SideSettings;
  encodedSettings?: SideSettings;
  loading: boolean;
  /** Counter of the latest bmp currently encoding */
  loadingCounter: number;
  /** Counter of the latest bmp encoded */
  loadedCounter: number;
}

interface Props {
  file: File | Fileish;
  showSnack: SnackBarElement['showSnackbar'];
  onBack: () => void;
}

interface State {
  source?: SourceImage;
  sides: [Side, Side];
  /** Source image load */
  loading: boolean;
  loadingCounter: number;
  error?: string;
  mobileView: boolean;
}

interface UpdateImageOptions {
  skipPreprocessing?: boolean;
}

async function processInput(
  data: ImageData,
  inputProcessData: InputProcessorState,
  processor: Processor,
) {
  let processedData = data;

  if (inputProcessData.rotate.rotate !== 0) {
    processedData = await processor.rotate(processedData, inputProcessData.rotate);
  }

  return processedData;
}

async function preprocessImage(
  source: SourceImage,
  preprocessData: PreprocessorState,
  processor: Processor,
): Promise<ImageData> {
  let result = source.processed;

  if (preprocessData.resize.enabled) {
    if (preprocessData.resize.method === 'vector' && source.vectorImage) {
      result = processor.vectorResize(
        source.vectorImage,
        preprocessData.resize,
      );
    } else if (isHqx(preprocessData.resize)) {
      // Hqx can only do x2, x3 or x4.
      result = await processor.workerResize(result, preprocessData.resize);
      // Seems like the globals from Rust from hqx and resize are conflicting.
      // For now we can fix that by terminating the worker.
      // TODO: Use wasm-bindgen’s new --web target to create a proper ES6 module
      // and remove this.
      processor.terminateWorker();
      // If the target size is not a clean x2, x3 or x4, use Catmull-Rom
      // for the remaining scaling.
      const pixelOpts = { ...preprocessData.resize, method: 'catrom' };
      result = await processor.workerResize(result, pixelOpts as WorkerResizeOptions);
    } else if (isWorkerResizeOptions(preprocessData.resize)) {
      result = await processor.workerResize(result, preprocessData.resize);
    } else {
      result = processor.resize(result, preprocessData.resize as BrowserResizeOptions);
    }
  }
  if (preprocessData.quantizer.enabled) {
    result = await processor.imageQuant(result, preprocessData.quantizer);
  }
  return result;
}

async function compressImage(
  image: ImageData,
  encodeData: EncoderState,
  sourceFilename: string,
  processor: Processor,
): Promise<Fileish> {
  const compressedData = await (() => {
    switch (encodeData.type) {
      case optiPNG.type: return processor.optiPngEncode(image, encodeData.options);
      case mozJPEG.type: return processor.mozjpegEncode(image, encodeData.options);
      case webP.type: return processor.webpEncode(image, encodeData.options);
      case browserPNG.type: return processor.browserPngEncode(image);
      case browserJPEG.type: return processor.browserJpegEncode(image, encodeData.options);
      case browserWebP.type: return processor.browserWebpEncode(image, encodeData.options);
      case browserGIF.type: return processor.browserGifEncode(image);
      case browserTIFF.type: return processor.browserTiffEncode(image);
      case browserJP2.type: return processor.browserJp2Encode(image);
      case browserBMP.type: return processor.browserBmpEncode(image);
      case browserPDF.type: return processor.browserPdfEncode(image);
      default: throw Error(`Unexpected encoder ${JSON.stringify(encodeData)}`);
    }
  })();

  const encoder = encoderMap[encodeData.type];

  return new Fileish(
    [compressedData],
    sourceFilename.replace(/.[^.]*$/, `.${encoder.extension}`),
    { type: encoder.mimeType },
  );
}

function stateForNewSourceData(state: State, newSource: SourceImage): State {
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

async function processSvg(blob: Blob): Promise<HTMLImageElement> {
  // Firefox throws if you try to draw an SVG to canvas that doesn't have width/height.
  // In Chrome it loads, but drawImage behaves weirdly.
  // This function sets width/height if it isn't already set.
  const parser = new DOMParser();
  const text = await blobToText(blob);
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
  return blobToImg(new Blob([newSource], { type: 'image/svg+xml' }));
}

// These are only used in the mobile view
const resultTitles = ['Top', 'Bottom'];
// These are only used in the desktop view
const buttonPositions =
  ['download-left', 'download-right'] as ('download-left' | 'download-right')[];

const originalDocumentTitle = document.title;

export default class Compress extends Component<Props, State> {
  widthQuery = window.matchMedia('(max-width: 599px)');

  state: State = {
    source: undefined,
    loading: false,
    loadingCounter: 0,
    sides: [
      {
        latestSettings: {
          preprocessorState: defaultPreprocessorState,
          encoderState: { type: identity.type, options: identity.defaultOptions },
        },
        loadingCounter: 0,
        loadedCounter: 0,
        loading: false,
      },
      {
        latestSettings: {
          preprocessorState: defaultPreprocessorState,
          encoderState: { type: mozJPEG.type, options: mozJPEG.defaultOptions },
        },
        loadingCounter: 0,
        loadedCounter: 0,
        loading: false,
      },
    ],
    mobileView: this.widthQuery.matches,
  };

  private readonly encodeCache = new ResultCache();
  private readonly leftProcessor = new Processor();
  private readonly rightProcessor = new Processor();
  // For debouncing calls to updateImage for each side.
  private readonly updateImageTimeoutIds: [number?, number?] = [undefined, undefined];

  constructor(props: Props) {
    super(props);
    this.widthQuery.addListener(this.onMobileWidthChange);
    this.updateFile(props.file);

    import('../../lib/sw-bridge').then(({ mainAppLoaded }) => mainAppLoaded());
  }

  @bind
  private onMobileWidthChange() {
    this.setState({ mobileView: this.widthQuery.matches });
  }

  private onEncoderTypeChange(index: 0 | 1, newType: EncoderType): void {
    this.setState({
      sides: cleanSet(this.state.sides, `${index}.latestSettings.encoderState`, {
        type: newType,
        options: encoderMap[newType].defaultOptions,
      }),
    });
  }

  private onPreprocessorOptionsChange(index: 0 | 1, options: PreprocessorState): void {
    this.setState({
      sides: cleanSet(this.state.sides, `${index}.latestSettings.preprocessorState`, options),
    });
  }

  private onEncoderOptionsChange(index: 0 | 1, options: EncoderOptions): void {
    this.setState({
      sides: cleanSet(this.state.sides, `${index}.latestSettings.encoderState.options`, options),
    });
  }

  private updateDocumentTitle(filename: string = ''): void {
    document.title = filename ? `${filename} - ${originalDocumentTitle}` : originalDocumentTitle;
  }

  componentWillReceiveProps(nextProps: Props): void {
    if (nextProps.file !== this.props.file) {
      this.updateFile(nextProps.file);
    }
  }

  componentWillUnmount(): void {
    this.updateDocumentTitle();
  }

  componentDidUpdate(prevProps: Props, prevState: State): void {
    const { source, sides } = this.state;

    const sourceDataChanged =
      // Has the source object become set/unset?
      !!source !== !!prevState.source ||
      // Or has the processed data changed?
      (source && prevState.source && source.processed !== prevState.source.processed);

    for (const [i, side] of sides.entries()) {
      const prevSettings = prevState.sides[i].latestSettings;
      const encoderChanged = side.latestSettings.encoderState !== prevSettings.encoderState;
      const preprocessorChanged =
        side.latestSettings.preprocessorState !== prevSettings.preprocessorState;

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
    const otherIndex = (index + 1) % 2;
    const oldSettings = this.state.sides[otherIndex];
    const newSettings = { ...this.state.sides[index] };

    // Create a new object URL for the new settings. This avoids both sides sharing a URL, which
    // means it can be safely revoked without impacting the other side.
    if (newSettings.file) newSettings.downloadUrl = URL.createObjectURL(newSettings.file);

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

  @bind
  private async onInputProcessorChange(options: InputProcessorState): Promise<void> {
    const source = this.state.source;
    if (!source) return;

    const oldRotate = source.inputProcessorState.rotate.rotate;
    const newRotate = options.rotate.rotate;
    const orientationChanged = oldRotate % 180 !== newRotate % 180;
    const loadingCounter = this.state.loadingCounter + 1;
    // Either processor is good enough here.
    const processor = this.leftProcessor;

    this.setState({
      loadingCounter, loading: true,
      source: cleanSet(source, 'inputProcessorState', options),
    });

    // Abort any current encode jobs, as they're redundant now.
    this.leftProcessor.abortCurrent();
    this.rightProcessor.abortCurrent();

    try {
      const processed = await processInput(source.decoded, options, processor);

      // Another file has been opened/processed before this one processed.
      if (this.state.loadingCounter !== loadingCounter) return;

      let newState = { ...this.state, loading: false };
      newState = cleanSet(newState, 'source.processed', processed);
      newState = stateForNewSourceData(newState, newState.source!);

      if (orientationChanged) {
        // If orientation has changed, we should flip the resize values.
        for (const i of [0, 1]) {
          const resizeSettings = newState.sides[i].latestSettings.preprocessorState.resize;
          newState = cleanMerge(newState, `sides.${i}.latestSettings.preprocessorState.resize`, {
            width: resizeSettings.height,
            height: resizeSettings.width,
          });
        }
      }
      this.setState(newState);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error(err);
      // Another file has been opened/processed before this one processed.
      if (this.state.loadingCounter !== loadingCounter) return;
      this.props.showSnack('Processing error');
      this.setState({ loading: false });
    }
  }

  @bind
  private async updateFile(file: File | Fileish) {
    const loadingCounter = this.state.loadingCounter + 1;
    // Either processor is good enough here.
    const processor = this.leftProcessor;

    this.setState({ loadingCounter, loading: true });

    // Abort any current encode jobs, as they're redundant now.
    this.leftProcessor.abortCurrent();
    this.rightProcessor.abortCurrent();

    try {
      let decoded: ImageData;
      let vectorImage: HTMLImageElement | undefined;

      // Special-case SVG. We need to avoid createImageBitmap because of
      // https://bugs.chromium.org/p/chromium/issues/detail?id=606319.
      // Also, we cache the HTMLImageElement so we can perform vector resizing later.
      if (file.type.startsWith('image/svg+xml')) {
        vectorImage = await processSvg(file);
        decoded = drawableToImageData(vectorImage);
      } else {
        // Either processor is good enough here.
        decoded = await decodeImage(file, processor);
      }

      const processed = await processInput(decoded, defaultInputProcessorState, processor);

      // Another file has been opened/processed before this one processed.
      if (this.state.loadingCounter !== loadingCounter) return;

      let newState: State = {
        ...this.state,
        source: {
          decoded, file, vectorImage, processed,
          inputProcessorState: defaultInputProcessorState,
        },
        loading: false,
      };

      newState = stateForNewSourceData(newState, newState.source!);

      for (const i of [0, 1]) {
        // Default resize values come from the image:
        newState = cleanMerge(newState, `sides.${i}.latestSettings.preprocessorState.resize`, {
          width: processed.width,
          height: processed.height,
          method: vectorImage ? 'vector' : 'lanczos3',
        });
      }

      this.updateDocumentTitle(file.name);
      this.setState(newState);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error(err);
      // Another file has been opened/processed before this one processed.
      if (this.state.loadingCounter !== loadingCounter) return;
      this.props.showSnack('Invalid image');
      this.setState({ loading: false });
    }
  }

  /**
   * Debounce the heavy lifting of updateImage.
   * Otherwise, the thrashing causes jank, and sometimes crashes iOS Safari.
   */
  private queueUpdateImage(index: number, options: UpdateImageOptions = {}): void {
    // Call updateImage after this delay, unless queueUpdateImage is called again, in which case the
    // timeout is reset.
    const delay = 100;

    clearTimeout(this.updateImageTimeoutIds[index]);

    this.updateImageTimeoutIds[index] = self.setTimeout(
      () => {
        this.updateImage(index, options).catch((err) => {
          console.error(err);
        });
      },
      delay,
    );
  }

  private async updateImage(index: number, options: UpdateImageOptions = {}): Promise<void> {
    const {
      skipPreprocessing = false,
    } = options;
    const { source } = this.state;
    if (!source) return;

    // Each time we trigger an async encode, the counter changes.
    const loadingCounter = this.state.sides[index].loadingCounter + 1;

    let sides = cleanMerge(this.state.sides, index, {
      loadingCounter,
      loading: true,
    });

    this.setState({ sides });

    const side = sides[index];
    const settings = side.latestSettings;

    let file: File | Fileish | undefined;
    let preprocessed: ImageData | undefined;
    let data: ImageData | undefined;
    const cacheResult = this.encodeCache.match(
      source.processed, settings.preprocessorState, settings.encoderState,
    );
    const processor = (index === 0) ? this.leftProcessor : this.rightProcessor;

    // Abort anything the processor is currently doing.
    // Although the processor will abandon current tasks when a new one is called,
    // we might not call another task here. Eg, we might get the result from the cache.
    processor.abortCurrent();

    if (cacheResult) {
      ({ file, preprocessed, data } = cacheResult);
    } else {
      try {
        // Special case for identity
        if (settings.encoderState.type === identity.type) {
          file = source.file;
          data = source.processed;
        } else {
          preprocessed = (skipPreprocessing && side.preprocessed)
            ? side.preprocessed
            : await preprocessImage(source, settings.preprocessorState, processor);

          file = await compressImage(
            preprocessed, settings.encoderState, source.file.name, processor,
          );
          data = await decodeImage(file, processor);

          this.encodeCache.add({
            data,
            preprocessed,
            file,
            sourceData: source.processed,
            encoderState: settings.encoderState,
            preprocessorState: settings.preprocessorState,
          });
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        this.props.showSnack(`Processing error (type=${settings.encoderState.type}): ${err}`);
        throw err;
      }
    }

    const latestData = this.state.sides[index];
    // If a later encode has landed before this one, return.
    if (loadingCounter < latestData.loadedCounter) {
      return;
    }

    if (latestData.downloadUrl) URL.revokeObjectURL(latestData.downloadUrl);

    sides = cleanMerge(this.state.sides, index, {
      file,
      data,
      preprocessed,
      downloadUrl: URL.createObjectURL(file),
      loading: sides[index].loadingCounter !== loadingCounter,
      loadedCounter: loadingCounter,
      encodedSettings: settings,
    });

    this.setState({ sides });
  }

  render({ onBack }: Props, { loading, sides, source, mobileView }: State) {
    const [leftSide, rightSide] = sides;
    const [leftImageData, rightImageData] = sides.map(i => i.data);

    const options = sides.map((side, index) => (
      // tslint:disable-next-line:jsx-key
      <Options
        source={source}
        mobileView={mobileView}
        preprocessorState={side.latestSettings.preprocessorState}
        encoderState={side.latestSettings.encoderState}
        onEncoderTypeChange={this.onEncoderTypeChange.bind(this, index as 0|1)}
        onEncoderOptionsChange={this.onEncoderOptionsChange.bind(this, index as 0|1)}
        onPreprocessorOptionsChange={this.onPreprocessorOptionsChange.bind(this, index as 0|1)}
      />
    ));

    const copyDirections =
      (mobileView ? ['down', 'up'] : ['right', 'left']) as CopyAcrossIconProps['copyDirection'][];

    const results = sides.map((side, index) => (
      // tslint:disable-next-line:jsx-key
      <Results
        downloadUrl={side.downloadUrl}
        imageFile={side.file}
        source={source}
        loading={loading || side.loading}
        copyDirection={copyDirections[index]}
        onCopyToOtherClick={this.onCopyToOtherClick.bind(this, index as 0|1)}
        buttonPosition={mobileView ? 'stack-right' : buttonPositions[index]}
      >
        {!mobileView ? null : [
          <ExpandIcon class={style.expandIcon} key="expand-icon"/>,
          `${resultTitles[index]} (${encoderMap[side.latestSettings.encoderState.type].label})`,
        ]}
      </Results>
    ));

    // For rendering, we ideally want the settings that were used to create the data, not the latest
    // settings.
    const leftDisplaySettings = leftSide.encodedSettings || leftSide.latestSettings;
    const rightDisplaySettings = rightSide.encodedSettings || rightSide.latestSettings;
    const leftImgContain = leftDisplaySettings.preprocessorState.resize.enabled &&
      leftDisplaySettings.preprocessorState.resize.fitMethod === 'contain';
    const rightImgContain = rightDisplaySettings.preprocessorState.resize.enabled &&
      rightDisplaySettings.preprocessorState.resize.fitMethod === 'contain';

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
          inputProcessorState={source && source.inputProcessorState}
          onInputProcessorChange={this.onInputProcessorChange}
        />
        {mobileView
          ? (
            <div class={style.options}>
              <multi-panel class={style.multiPanel} open-one-only>
                {results[0]}
                {options[0]}
                {results[1]}
                {options[1]}
              </multi-panel>
            </div>
          ) : ([
            <div class={style.options} key="options0">
              {options[0]}
              {results[0]}
            </div>,
            <div class={style.options} key="options1">
              {options[1]}
              {results[1]}
            </div>,
          ])
        }
      </div>
    );
  }
}
