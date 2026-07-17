import { h, Component } from 'preact';

import * as style from './style.css';
import 'add-css:./style.css';
import {
  blobToImg,
  blobToText,
  builtinDecode,
  sniffMimeType,
  canDecodeImageType,
  abortable,
  assertSignal,
  ImageMimeTypes,
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
import Output from './Output';
import Options from './Options';
import ResultCache from './result-cache';
import { cleanMerge, cleanSet } from '../util/clean-modify';
import './custom-els/MultiPanel';
import Results from './Results';
import WorkerBridge from '../worker-bridge';
import type SnackBarElement from 'shared/custom-els/snack-bar';
import { drawableToImageData } from '../util/canvas';
import { Ben2Capability, probeBen2Capability } from './ben2-capability';
import {
  mainJobSchedulingDecision,
  preprocessImage,
  runMainPreprocessingJob,
} from './main-job';
import {
  BEN2_TERMINAL_MESSAGE,
  Ben2SideJobScheduler,
  Ben2TerminalToggleRetry,
  ben2ResizeOptions,
  ben2TerminalSideState,
  createBen2Coordinator,
  normaliseBen2SideSettings,
  processSideImage,
} from './ben2-processing';
import { Ben2CacheLifecycle } from './ben2-cache-lifecycle';

export type OutputType = EncoderType | 'identity';

export interface SourceImage {
  file: File;
  decoded: ImageData;
  preprocessed: ImageData;
  vectorImage?: HTMLImageElement;
}

export interface SideSettings {
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
  mobileView: boolean;
  preprocessorState: PreprocessorState;
  encodedPreprocessorState?: PreprocessorState;
  ben2Capability: Ben2Capability;
  ben2ModelCached: boolean;
  ben2Downloading: boolean;
  ben2TerminalErrors: [string?, string?];
}

interface MainJob {
  file: File;
  preprocessorState: PreprocessorState;
}

interface LoadingFileInfo {
  loading: boolean;
  filename?: string;
}

interface PersistedSideSettings {
  latestSettings?: Partial<SideSettings>;
  encodedSettings?: Partial<SideSettings>;
}

/** Normalize persisted settings only; runtime side state never enters here. */
export function normalizeSideSettings(
  saved: PersistedSideSettings | undefined,
  fallback: SideSettings,
): { latestSettings: SideSettings; encodedSettings?: SideSettings } {
  const normalised = normaliseBen2SideSettings(
    {
      latestSettings: {
        ...fallback,
        ...saved?.latestSettings,
        processorState: {
          ...fallback.processorState,
          ...saved?.latestSettings?.processorState,
        },
      },
      encodedSettings: saved?.encodedSettings
        ? {
            ...saved.encodedSettings,
            processorState: {
              ...defaultProcessorState,
              ...saved.encodedSettings.processorState,
            },
          }
        : undefined,
    },
    defaultProcessorState,
  );

  return {
    latestSettings: normalised.latestSettings!,
    encodedSettings: normalised.encodedSettings,
  };
}

function loadStoredSideSettings(
  key: string,
  fallback: SideSettings,
): { latestSettings: SideSettings; encodedSettings?: SideSettings } {
  const stored = localStorage.getItem(key);
  return normalizeSideSettings(
    stored ? JSON.parse(stored) : undefined,
    fallback,
  );
}

async function decodeImage(
  signal: AbortSignal,
  blob: Blob,
  workerBridge: WorkerBridge,
): Promise<ImageData> {
  assertSignal(signal);
  const mimeType = await abortable(signal, sniffMimeType(blob));

  try {
    const canDecode = await abortable(signal, canDecodeImageType(mimeType));
    if (!canDecode) {
      if (mimeType === 'image/avif') {
        return await workerBridge.avifDecode(signal, blob);
      }
      if (mimeType === 'image/webp') {
        return await workerBridge.webpDecode(signal, blob);
      }
      if (mimeType === 'image/jxl') {
        return await workerBridge.jxlDecode(signal, blob);
      }
      if (mimeType === 'image/webp2') {
        return await workerBridge.wp2Decode(signal, blob);
      }
      if (mimeType === 'image/qoi') {
        return await workerBridge.qoiDecode(signal, blob);
      }
    }
    // Otherwise fall through and try built-in decoding for a laugh.
    return await builtinDecode(signal, blob);
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw err;
    console.log(err);
    throw Error("Couldn't decode image");
  }
}

function ben2IsEnabled(processorState: ProcessorState): boolean {
  return processorState.ben2.enabled;
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

  // This type ensures the image mimetype is consistent with our mimetype sniffer
  const type: ImageMimeTypes = encoder.meta.mimeType;

  return new File(
    [compressedData],
    sourceFilename.replace(/.[^.]*$/, `.${encoder.meta.extension}`),
    { type },
  );
}

function stateForNewSourceData(state: State): State {
  let newState = { ...state };

  for (const i of [0, 1]) {
    // Ditch previous encodings
    const downloadUrl = newState.sides[i].downloadUrl;
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);

    newState = cleanMerge(newState, `sides.${i}`, {
      processed: undefined,
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

const loadingIndicator = '⏳ ';

const originalDocumentTitle = document.title;

function updateDocumentTitle(loadingFileInfo: LoadingFileInfo): void {
  const { loading, filename } = loadingFileInfo;
  let title = '';
  if (loading) title += loadingIndicator;
  if (filename) title += filename + ' - ';
  title += originalDocumentTitle;
  document.title = title;
}

export default class Compress extends Component<Props, State> {
  widthQuery = window.matchMedia('(max-width: 599px)');

  state: State = {
    source: undefined,
    loading: false,
    preprocessorState: defaultPreprocessorState,
    ben2Capability: { state: 'checking' },
    ben2ModelCached: false,
    ben2Downloading: false,
    ben2TerminalErrors: [undefined, undefined],
    sides: [
      {
        ...loadStoredSideSettings('leftSideSettings', {
          processorState: defaultProcessorState,
          encoderState: undefined,
        }),
        loading: false,
      },
      {
        ...loadStoredSideSettings('rightSideSettings', {
          processorState: defaultProcessorState,
          encoderState: {
            type: 'mozJPEG',
            options: encoderMap.mozJPEG.meta.defaultOptions,
          },
        }),
        loading: false,
      },
    ],
    mobileView: this.widthQuery.matches,
  };

  private readonly encodeCache = new ResultCache();
  private readonly ben2Coordinator = createBen2Coordinator(new WorkerBridge());
  private readonly sideJobScheduler = new Ben2SideJobScheduler(
    defaultProcessorState,
  );
  private readonly ben2TerminalToggleRetry = new Ben2TerminalToggleRetry(
    this.ben2Coordinator,
    this.sideJobScheduler,
  );
  private readonly ben2CacheLifecycle = new Ben2CacheLifecycle({
    isEnabled: () =>
      this.state.sides.some((side) =>
        ben2IsEnabled(side.latestSettings.processorState),
      ),
    readCached: async () => {
      const { ben2CacheStatus, ben2ModelIsCached } = await import(
        '../sw-bridge'
      );
      return ben2ModelIsCached(await ben2CacheStatus());
    },
    download: async () => {
      const { downloadBen2Model } = await import('../sw-bridge');
      await downloadBen2Model();
    },
    setCached: (cached) => this.setBen2ModelCached(cached),
    setDownloading: (ben2Downloading) => {
      if (!this.unmounted) this.setState({ ben2Downloading });
    },
  });
  // One for each side
  private readonly workerBridges = [new WorkerBridge(), new WorkerBridge()];
  /** Abort controller for actions that impact both sites, like source image decoding and preprocessing */
  private mainAbortController = new AbortController();
  // And again one for each side
  private sideAbortControllers = [new AbortController(), new AbortController()];
  /** For debouncing calls to updateImage for each side. */
  private updateImageTimeout?: number;
  private unmounted = false;

  constructor(props: Props) {
    super(props);
    this.widthQuery.addListener(this.onMobileWidthChange);
    this.sourceFile = props.file;
    this.queueUpdateImage({ immediate: true });

    import('../sw-bridge').then(({ mainAppLoaded }) => mainAppLoaded());
  }

  componentDidMount(): void {
    probeBen2Capability().then((ben2Capability) => {
      if (this.unmounted) return;
      this.setState((state) => ({
        ben2Capability,
        sides:
          ben2Capability.state !== 'supported' || !state.source?.vectorImage
            ? state.sides
            : (state.sides.map((side) => ({
                ...side,
                latestSettings: {
                  ...side.latestSettings,
                  processorState:
                    state.ben2ModelCached &&
                    side.latestSettings.processorState.ben2.enabled &&
                    side.latestSettings.processorState.resize.method ===
                      'vector'
                      ? cleanMerge(
                          side.latestSettings.processorState,
                          'resize',
                          { method: 'lanczos3' },
                        )
                      : side.latestSettings.processorState,
                },
              })) as [Side, Side]),
      }));
    });
    this.ben2CacheLifecycle.mount();
  }

  private setBen2ModelCached(cached: boolean): void {
    if (this.unmounted) return;
    if (this.state.ben2ModelCached && !cached) {
      this.ben2Coordinator.invalidate();
      this.ben2TerminalToggleRetry.invalidate();
    }
    this.setState((state) => ({
      ben2ModelCached: cached,
      sides:
        cached && !state.ben2ModelCached && state.source?.vectorImage
          ? (state.sides.map((side) => ({
              ...side,
              latestSettings: {
                ...side.latestSettings,
                processorState: this.normalizeBen2Resize(
                  side.latestSettings.processorState,
                  true,
                ),
              },
            })) as [Side, Side])
          : state.sides,
    }));
  }

  private onMobileWidthChange = () => {
    this.setState({ mobileView: this.widthQuery.matches });
  };

  private normalizeBen2Resize(
    options: ProcessorState,
    modelCached = this.state.ben2ModelCached,
  ): ProcessorState {
    const resize = ben2ResizeOptions(
      options.resize,
      ben2IsEnabled(options) &&
        modelCached &&
        this.state.ben2Capability.state === 'supported' &&
        !!this.state.source?.vectorImage,
    );
    return resize === options.resize ? options : { ...options, resize };
  }

  private clearSideTerminal(index: 0 | 1): [string?, string?] {
    this.ben2TerminalToggleRetry.clear(index);
    this.sideJobScheduler.clearTerminal(index);
    return cleanSet(this.state.ben2TerminalErrors, index, undefined);
  }

  private onEncoderTypeChange = (index: 0 | 1, newType: OutputType): void => {
    this.setState({
      ben2TerminalErrors: this.clearSideTerminal(index),
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
  };

  private onProcessorOptionsChange = (
    index: 0 | 1,
    options: ProcessorState,
  ): void => {
    const previous = this.state.sides[index].latestSettings.processorState;
    const changed = this.ben2TerminalToggleRetry.processorChange(
      index,
      previous,
      options,
      this.state.source,
    );
    // The retry controller has already remembered an eligible terminal
    // on→off transition before this side's scheduler identity is cleared.
    this.sideJobScheduler.clearTerminal(index);
    this.setState({
      ben2TerminalErrors: cleanSet(
        this.state.ben2TerminalErrors,
        index,
        undefined,
      ),
      sides: cleanSet(
        this.state.sides,
        `${index}.latestSettings.processorState`,
        this.normalizeBen2Resize(changed),
      ),
    });
  };

  private onEncoderOptionsChange = (
    index: 0 | 1,
    options: EncoderOptions,
  ): void => {
    this.setState({
      ben2TerminalErrors: this.clearSideTerminal(index),
      sides: cleanSet(
        this.state.sides,
        `${index}.latestSettings.encoderState.options`,
        options,
      ),
    });
  };

  componentWillReceiveProps(nextProps: Props): void {
    if (nextProps.file !== this.props.file) {
      this.ben2Coordinator.invalidate();
      this.sideJobScheduler.invalidate();
      this.ben2TerminalToggleRetry.invalidate();
      this.sourceFile = nextProps.file;
      this.queueUpdateImage({ immediate: true });
    }
  }

  componentWillUnmount(): void {
    this.unmounted = true;
    updateDocumentTitle({ loading: false });
    this.widthQuery.removeListener(this.onMobileWidthChange);
    this.ben2CacheLifecycle.dispose();
    this.mainAbortController.abort();
    this.ben2Coordinator.invalidate();
    this.sideJobScheduler.invalidate();
    this.ben2TerminalToggleRetry.invalidate();
    for (const controller of this.sideAbortControllers) {
      controller.abort();
    }
  }

  componentDidUpdate(prevProps: Props, prevState: State): void {
    const wasLoading =
      prevState.loading ||
      prevState.sides[0].loading ||
      prevState.sides[1].loading;
    const isLoading =
      this.state.loading ||
      this.state.sides[0].loading ||
      this.state.sides[1].loading;
    const sourceChanged = prevState.source !== this.state.source;
    if (wasLoading !== isLoading || sourceChanged) {
      updateDocumentTitle({
        loading: isLoading,
        filename: this.state.source?.file.name,
      });
    }
    this.ben2CacheLifecycle.updatePolling();
    this.queueUpdateImage();
  }

  private onCopyToOtherClick = async (index: 0 | 1) => {
    const otherIndex: 0 | 1 = index ? 0 : 1;
    const oldSettings = this.state.sides[otherIndex];
    const newSettings = {
      ...this.state.sides[index],
      latestSettings: {
        ...this.state.sides[index].latestSettings,
        processorState: this.normalizeBen2Resize(
          this.state.sides[index].latestSettings.processorState,
        ),
      },
    };

    // Create a new object URL for the new settings. This avoids both sides sharing a URL, which
    // means it can be safely revoked without impacting the other side.
    if (newSettings.file) {
      newSettings.downloadUrl = URL.createObjectURL(newSettings.file);
    }

    this.setState({
      ben2TerminalErrors: this.clearSideTerminal(otherIndex),
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
  };
  /**
   * This function saves encodedSettings and latestSettings of
   * particular side in browser local storage
   * @param index : (0|1)
   * @returns
   */
  private onSaveSideSettingsClick = async (index: 0 | 1) => {
    if (index === 0) {
      const leftSideSettings = JSON.stringify({
        encodedSettings: this.state.sides[index].encodedSettings,
        latestSettings: this.state.sides[index].latestSettings,
      });
      localStorage.setItem('leftSideSettings', leftSideSettings);
      // Firing an event when we save side settings in localstorage
      window.dispatchEvent(new CustomEvent('leftSideSettings'));
      await this.props.showSnack('Left side settings saved', {
        timeout: 1500,
        actions: ['dismiss'],
      });
      return;
    }

    if (index === 1) {
      const rightSideSettings = JSON.stringify({
        encodedSettings: this.state.sides[index].encodedSettings,
        latestSettings: this.state.sides[index].latestSettings,
      });
      localStorage.setItem('rightSideSettings', rightSideSettings);
      // Firing an event when we save side settings in localstorage
      window.dispatchEvent(new CustomEvent('rightSideSettings'));
      await this.props.showSnack('Right side settings saved', {
        timeout: 1500,
        actions: ['dismiss'],
      });
      return;
    }
  };

  /**
   * This function sets the side state with catched localstorage
   * value as per side index provided
   * @param index : (0|1)
   * @returns
   */
  private onImportSideSettingsClick = async (index: 0 | 1) => {
    const leftSideSettingsString = localStorage.getItem('leftSideSettings');
    const rightSideSettingsString = localStorage.getItem('rightSideSettings');

    if (index === 0 && leftSideSettingsString) {
      const oldLeftSideSettings = this.state.sides[index];
      const normalized = normalizeSideSettings(
        JSON.parse(leftSideSettingsString),
        this.state.sides[index].latestSettings,
      );
      const newLeftSideSettings = {
        ...this.state.sides[index],
        ...normalized,
        latestSettings: {
          ...normalized.latestSettings,
          processorState: this.normalizeBen2Resize(
            normalized.latestSettings.processorState,
          ),
        },
      };
      this.setState({
        ben2TerminalErrors: this.clearSideTerminal(index),
        sides: cleanSet(this.state.sides, index, newLeftSideSettings),
      });
      const result = await this.props.showSnack('Left side settings imported', {
        timeout: 3000,
        actions: ['undo', 'dismiss'],
      });
      if (result === 'undo') {
        this.setState({
          sides: cleanSet(this.state.sides, index, oldLeftSideSettings),
        });
      }
      return;
    }

    if (index === 1 && rightSideSettingsString) {
      const oldRightSideSettings = this.state.sides[index];
      const normalized = normalizeSideSettings(
        JSON.parse(rightSideSettingsString),
        this.state.sides[index].latestSettings,
      );
      const newRightSideSettings = {
        ...this.state.sides[index],
        ...normalized,
        latestSettings: {
          ...normalized.latestSettings,
          processorState: this.normalizeBen2Resize(
            normalized.latestSettings.processorState,
          ),
        },
      };
      this.setState({
        ben2TerminalErrors: this.clearSideTerminal(index),
        sides: cleanSet(this.state.sides, index, newRightSideSettings),
      });
      const result = await this.props.showSnack(
        'Right side settings imported',
        {
          timeout: 3000,
          actions: ['undo', 'dismiss'],
        },
      );
      if (result === 'undo') {
        this.setState({
          sides: cleanSet(this.state.sides, index, oldRightSideSettings),
        });
      }
      return;
    }
  };

  private onPreprocessorChange = async (
    preprocessorState: PreprocessorState,
  ): Promise<void> => {
    const source = this.state.source;
    if (!source) return;

    const oldRotate = this.state.preprocessorState.rotate.rotate;
    const newRotate = preprocessorState.rotate.rotate;
    const orientationChanged = oldRotate % 180 !== newRotate % 180;

    this.ben2Coordinator.invalidate();
    this.sideJobScheduler.invalidate();
    this.ben2TerminalToggleRetry.invalidate();
    this.setState((state) => ({
      loading: true,
      preprocessorState,
      ben2TerminalErrors: [undefined, undefined],
      // Flip resize values if orientation has changed
      sides: !orientationChanged
        ? state.sides
        : (state.sides.map((side) => {
            const currentResizeSettings =
              side.latestSettings.processorState.resize;
            const resizeSettings: Partial<ProcessorState['resize']> = {
              width: currentResizeSettings.height,
              height: currentResizeSettings.width,
            };
            return cleanMerge(
              side,
              'latestSettings.processorState.resize',
              resizeSettings,
            );
          }) as [Side, Side]),
    }));
  };

  /**
   * Debounce the heavy lifting of updateImage.
   * Otherwise, the thrashing causes jank, and sometimes crashes iOS Safari.
   */
  private queueUpdateImage({ immediate }: { immediate?: boolean } = {}): void {
    // Call updateImage after this delay, unless queueUpdateImage is called
    // again, in which case the timeout is reset.
    const delay = 100;

    clearTimeout(this.updateImageTimeout);
    if (immediate) {
      this.updateImage();
    } else {
      this.updateImageTimeout = setTimeout(() => this.updateImage(), delay);
    }
  }

  private sourceFile: File;
  /** The in-progress job for decoding and preprocessing */
  private activeMainJob?: MainJob;
  private onBen2Completed = (): void => {
    void this.ben2CacheLifecycle.refresh();
  };

  /**
   * Perform image processing.
   *
   * This function is a monster, but I didn't want to break it up, because it
   * never gets partially called. Instead, it looks at the current state, and
   * decides which steps can be skipped, and which can be cached.
   */
  private async updateImage() {
    const currentState = this.state;

    // State for this job
    const mainJobState: MainJob = {
      file: this.sourceFile,
      preprocessorState: currentState.preprocessorState,
    };
    const mainDecision = mainJobSchedulingDecision(
      {
        active: this.activeMainJob,
        completed: {
          file: currentState.source && currentState.source.file,
          preprocessorState: currentState.encodedPreprocessorState,
        },
      },
      mainJobState,
    );

    const needsDecoding = mainDecision.decoding;
    const needsPreprocessing = mainDecision.preprocessing;
    const { jobs: sideJobStates, work: sideWorksNeeded } =
      this.sideJobScheduler.plan(
        currentState.sides.map((side) => side.latestSettings) as [
          SideSettings,
          SideSettings,
        ],
        currentState.sides.map((side) => side.encodedSettings) as [
          SideSettings | undefined,
          SideSettings | undefined,
        ],
        currentState.ben2Capability,
        currentState.ben2ModelCached,
        needsPreprocessing,
      );

    let jobNeeded = false;

    // Abort running tasks & cycle the controllers
    if (needsDecoding || needsPreprocessing) {
      this.mainAbortController.abort();
      this.mainAbortController = new AbortController();
      jobNeeded = true;
      this.activeMainJob = mainJobState;
      this.ben2Coordinator.invalidate();
      this.sideJobScheduler.invalidate();
      this.ben2TerminalToggleRetry.invalidate();
    }
    for (const [i, sideWorkNeeded] of sideWorksNeeded.entries()) {
      if (sideWorkNeeded.processing || sideWorkNeeded.encoding) {
        this.sideAbortControllers[i].abort();
        this.sideAbortControllers[i] = new AbortController();
        jobNeeded = true;
        this.sideJobScheduler.start(i as 0 | 1, sideJobStates[i]);
      }
    }

    if (!jobNeeded) return;

    const mainSignal = this.mainAbortController.signal;
    const sideSignals = this.sideAbortControllers.map((ac) => ac.signal);

    let decoded: ImageData;
    let vectorImage: HTMLImageElement | undefined;

    // Handle decoding
    if (needsDecoding) {
      try {
        assertSignal(mainSignal);
        this.setState({ loading: true });

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
            this.workerBridges[0],
          );
        }

        // Set default resize values
        this.setState((currentState) => {
          if (mainSignal.aborted) return {};
          const sides = currentState.sides.map((side) => {
            const resizeState: Partial<ProcessorState['resize']> = {
              width: decoded.width,
              height: decoded.height,
              method:
                vectorImage &&
                !(
                  side.latestSettings.processorState.ben2.enabled &&
                  currentState.ben2Capability.state === 'supported' &&
                  currentState.ben2ModelCached
                )
                  ? 'vector'
                  : 'lanczos3',
              // Disable resizing, to make it clearer to the user that something changed here
              enabled: false,
            };
            return cleanMerge(
              side,
              'latestSettings.processorState.resize',
              resizeState,
            );
          }) as [Side, Side];
          return { sides };
        });
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        this.props.showSnack(`Source decoding error: ${err}`);
        throw err;
      }
    } else {
      ({ decoded, vectorImage } = currentState.source!);
    }

    let source: SourceImage;

    // Handle shared preprocessing (Rotate only).
    if (needsPreprocessing) {
      assertSignal(mainSignal);
      this.setState({
        loading: true,
        ben2TerminalErrors: [undefined, undefined],
      });

      const outcome = await runMainPreprocessingJob({
        signal: mainSignal,
        run: async () => ({
          decoded,
          vectorImage,
          preprocessed: await preprocessImage(
            mainSignal,
            decoded,
            mainJobState.preprocessorState,
            // Either side worker is good enough for shared rotation.
            this.workerBridges[0],
          ),
          file: mainJobState.file,
        }),
        isCurrent: () => this.activeMainJob === mainJobState,
        publish: (completedSource) => {
          source = completedSource;
          this.activeMainJob = undefined;
          this.setState((currentState) =>
            stateForNewSourceData({
              ...currentState,
              loading: false,
              source,
              encodedPreprocessorState: mainJobState.preprocessorState,
              ben2TerminalErrors: [undefined, undefined],
            }),
          );
        },
        fail: (err) => {
          this.activeMainJob = undefined;
          this.setState({ loading: false });
          this.props.showSnack(`Preprocessing error: ${err}`);
        },
      });
      if (outcome !== 'published') return;
    } else {
      source = currentState.source!;
    }

    // Allow side jobs to happen in parallel
    sideWorksNeeded.forEach(async (sideWorkNeeded, sideIndex) => {
      try {
        // If processing is true, encoding is always true.
        if (!sideWorkNeeded.encoding) return;

        const signal = sideSignals[sideIndex];
        const jobState = sideJobStates[sideIndex];
        const workerBridge = this.workerBridges[sideIndex];
        let file: File;
        let data: ImageData;
        let processed: ImageData | undefined = undefined;

        // If there's no encoder state, this is "original image", which also
        // doesn't allow processing.
        if (!jobState.encoderState) {
          file = source.file;
          data = source.preprocessed;
        } else {
          const cacheResult = this.encodeCache.match(
            source.preprocessed,
            jobState.processorState,
            jobState.encoderState,
          );

          if (cacheResult) {
            ({ file, processed, data } = cacheResult);
          } else {
            // Set loading state for this side
            this.setState((currentState) => {
              if (signal.aborted) return {};
              const sides = cleanMerge(currentState.sides, sideIndex, {
                loading: true,
              });
              return { sides };
            });

            if (sideWorkNeeded.processing) {
              processed = await processSideImage(
                signal,
                source,
                mainJobState.preprocessorState,
                jobState.processorState,
                workerBridge,
                this.ben2Coordinator,
                this.ben2CacheLifecycle.refresh,
                this.onBen2Completed,
              );

              // Update state for process completion, including intermediate render
              this.setState((currentState) => {
                if (
                  !this.sideJobScheduler.isCurrent(
                    sideIndex as 0 | 1,
                    jobState,
                    signal,
                  )
                )
                  return {};
                const currentSide = currentState.sides[sideIndex];
                const side: Side = {
                  ...currentSide,
                  processed,
                  // Intermediate render
                  data: processed,
                  encodedSettings: {
                    ...currentSide.encodedSettings,
                    processorState: jobState.processorState,
                  },
                };
                const sides = cleanSet(currentState.sides, sideIndex, side);
                return { sides };
              });
            } else {
              processed = currentState.sides[sideIndex].processed!;
            }

            file = await compressImage(
              signal,
              processed,
              jobState.encoderState,
              source.file.name,
              workerBridge,
            );
            data = await decodeImage(signal, file, workerBridge);

            this.encodeCache.add({
              data,
              processed,
              file,
              preprocessed: source.preprocessed,
              encoderState: jobState.encoderState,
              processorState: jobState.processorState,
            });
          }
        }

        this.setState(
          (currentState) => {
            if (
              !this.sideJobScheduler.isCurrent(
                sideIndex as 0 | 1,
                jobState,
                signal,
              )
            )
              return {};
            const currentSide = currentState.sides[sideIndex];

            if (currentSide.downloadUrl) {
              URL.revokeObjectURL(currentSide.downloadUrl);
            }

            const side: Side = {
              ...currentSide,
              data,
              file,
              downloadUrl: URL.createObjectURL(file),
              loading: false,
              processed,
              encodedSettings: {
                processorState: jobState.processorState,
                encoderState: jobState.encoderState,
              },
            };
            const sides = cleanSet(currentState.sides, sideIndex, side);
            return { sides };
          },
          () => {
            this.sideJobScheduler.complete(sideIndex as 0 | 1, jobState);
          },
        );
      } catch (err) {
        const jobState = sideJobStates[sideIndex];
        const settlement = this.sideJobScheduler.settleFailure(
          sideIndex as 0 | 1,
          jobState,
          sideSignals[sideIndex],
          err,
        );
        if (settlement === 'stale') return;

        if (settlement === 'model-not-cached') {
          this.ben2Coordinator.invalidate();
          this.ben2TerminalToggleRetry.invalidate();
          this.setState((currentState) => ({
            sides: cleanMerge(currentState.sides, sideIndex, {
              loading: false,
            }),
          }));
          return;
        }

        if (settlement === 'terminal') {
          this.setState((currentState) => ({
            ben2TerminalErrors: cleanSet(
              currentState.ben2TerminalErrors,
              sideIndex,
              BEN2_TERMINAL_MESSAGE,
            ),
            sides: cleanSet(
              currentState.sides,
              sideIndex,
              ben2TerminalSideState(currentState.sides[sideIndex]),
            ),
          }));
          return;
        }

        this.setState((currentState) => ({
          sides: cleanMerge(currentState.sides, sideIndex, {
            loading: false,
          }),
        }));
        this.props.showSnack(`Processing error: ${err}`);
      }
    });
  }

  render(
    { onBack }: Props,
    {
      loading,
      sides,
      source,
      mobileView,
      preprocessorState,
      ben2Capability,
      ben2ModelCached,
      ben2Downloading,
    }: State,
  ) {
    const [leftSide, rightSide] = sides;
    const [leftImageData, rightImageData] = sides.map((i) => i.data);

    const options = sides.map((side, index) => (
      <Options
        index={index as 0 | 1}
        source={source}
        mobileView={mobileView}
        processorState={side.latestSettings.processorState}
        encoderState={side.latestSettings.encoderState}
        ben2Capability={ben2Capability}
        ben2ModelCached={ben2ModelCached}
        ben2Downloading={ben2Downloading}
        onEncoderTypeChange={this.onEncoderTypeChange}
        onEncoderOptionsChange={this.onEncoderOptionsChange}
        onProcessorOptionsChange={this.onProcessorOptionsChange}
        onCopyToOtherSideClick={this.onCopyToOtherClick}
        onSaveSideSettingsClick={this.onSaveSideSettingsClick}
        onImportSideSettingsClick={this.onImportSideSettingsClick}
        onBen2Download={() => void this.ben2CacheLifecycle.download()}
      />
    ));

    const results = sides.map((side, index) => (
      <Results
        downloadUrl={side.downloadUrl}
        imageFile={side.file}
        source={source}
        loading={loading || side.loading}
        flipSide={mobileView || index === 1}
        typeLabel={
          side.latestSettings.encoderState
            ? encoderMap[side.latestSettings.encoderState.type].meta.label
            : `${side.file ? `${side.file.name}` : 'Original Image'}`
        }
      />
    ));

    // For rendering, we ideally want the settings that were used to create the
    // data, not the latest settings.
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
          preprocessorState={preprocessorState}
          onPreprocessorChange={this.onPreprocessorChange}
        />
        <button class={style.back} onClick={onBack}>
          <svg viewBox="0 0 61 53.3">
            <title>Back</title>
            <path
              class={style.backBlob}
              d="M0 25.6c-.5-7.1 4.1-14.5 10-19.1S23.4.1 32.2 0c8.8 0 19 1.6 24.4 8s5.6 17.8 1.7 27a29.7 29.7 0 01-20.5 18c-8.4 1.5-17.3-2.6-24.5-8S.5 32.6.1 25.6z"
            />
            <path
              class={style.backX}
              d="M41.6 17.1l-2-2.1-8.3 8.2-8.2-8.2-2 2 8.2 8.3-8.3 8.2 2.1 2 8.2-8.1 8.3 8.2 2-2-8.2-8.3z"
            />
          </svg>
        </button>
        {mobileView ? (
          <div class={style.options}>
            <multi-panel class={style.multiPanel} open-one-only>
              <div class={style.options1Theme}>{results[0]}</div>
              <div class={style.options1Theme}>{options[0]}</div>
              <div class={style.options2Theme}>{results[1]}</div>
              <div class={style.options2Theme}>{options[1]}</div>
            </multi-panel>
          </div>
        ) : (
          [
            <div class={style.options1} key="options1">
              {options[0]}
              {results[0]}
            </div>,
            <div class={style.options2} key="options2">
              {options[1]}
              {results[1]}
            </div>,
          ]
        )}
      </div>
    );
  }
}
