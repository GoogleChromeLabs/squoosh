import { Component, Fragment, h } from 'preact';

import 'add-css:./style.css';
import { resize } from 'features/processors/resize/client';
import type SnackBarElement from 'shared/custom-els/snack-bar';
import {
  defaultPreprocessorState,
  defaultProcessorState,
  encoderMap,
  EncoderOptions,
  EncoderState,
  EncoderType,
  PreprocessorState,
  ProcessorState,
} from '../feature-meta';
import { assertSignal } from '../util';
import { cleanMerge, cleanSet } from '../util/clean-modify';
import { isAbortError } from '../util/error';
import WorkerBridge from '../worker-bridge';
import './custom-els/MultiPanel';
import Options from './Options';
import Select from './Options/Select';
import Output from './Output';
import ResultCache from './result-cache';
import Results from './Results';
import { compressImage } from './stages/compress-stage';
import { decodeBitmap, decodeImage } from './stages/decode-stage';
import { preprocessImage } from './stages/preprocess-stage';
import * as style from './style.css';

export type OutputType = EncoderType | 'identity';

export interface SourceImage {
  file: File;
  decoded: ImageData;
  preprocessed: ImageData;
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
  /**
   * Settings user has selected.
   */
  latestSettings: SideSettings;
  /**
   * Settings actually used to process image.
   *
   * latestSettings gets assigned to this property as soon as the image of this side gets
   * processed.
   */
  encodedSettings?: SideSettings;
  loading: boolean;
}

interface Props {
  files: File[];
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
}

interface MainJob {
  file: File;
  preprocessorState: PreprocessorState;
}

interface SideJob {
  processorState: ProcessorState;
  encoderState?: EncoderState;
}

interface LoadingFileInfo {
  loading: boolean;
  filename?: string;
}

async function processImage(
  signal: AbortSignal,
  source: SourceImage,
  processorState: ProcessorState,
  workerBridge: WorkerBridge,
): Promise<ImageData> {
  assertSignal(signal);
  let result = source.preprocessed;

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

/**
 * If two processors are disabled, they're considered equivalent, otherwise
 * equivalence is based on ===
 */
function processorStateEquivalent(a: ProcessorState, b: ProcessorState) {
  // Quick exit
  if (a === b) return true;

  // All processors have the same keys
  for (const key of Object.keys(a) as Array<keyof ProcessorState>) {
    // If both processors are disabled, they're the same.
    if (!a[key].enabled && !b[key].enabled) continue;
    if (a !== b) return false;
  }

  return true;
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
    // Tasking catched side settings if available otherwise taking default settings
    sides: [
      localStorage.getItem('leftSideSettings')
        ? {
            ...JSON.parse(localStorage.getItem('leftSideSettings') as string),
            loading: false,
          }
        : {
            latestSettings: {
              processorState: defaultProcessorState,
              encoderState: undefined,
            },
            loading: false,
          },
      localStorage.getItem('rightSideSettings')
        ? {
            ...JSON.parse(localStorage.getItem('rightSideSettings') as string),
            loading: false,
          }
        : {
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
  /** For debouncing calls to updateImage for each side. */
  private updateImageTimeout?: number;

  constructor(props: Props) {
    super(props);
    this.widthQuery.addListener(this.onMobileWidthChange);
    this.sourceFile = props.files[0];
    this.files = props.files;
    this.queuePreviewedImageUpdate({ immediate: true });

    import('../sw-bridge').then(({ mainAppLoaded }) => mainAppLoaded());
  }

  private onMobileWidthChange = () => {
    this.setState({ mobileView: this.widthQuery.matches });
  };

  private onEncoderTypeChange = (index: 0 | 1, newType: OutputType): void => {
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
  };

  private onProcessorOptionsChange = (
    index: 0 | 1,
    options: ProcessorState,
  ): void => {
    this.setState({
      sides: cleanSet(
        this.state.sides,
        `${index}.latestSettings.processorState`,
        options,
      ),
    });
  };

  private onEncoderOptionsChange = (
    index: 0 | 1,
    options: EncoderOptions,
  ): void => {
    this.setState({
      sides: cleanSet(
        this.state.sides,
        `${index}.latestSettings.encoderState.options`,
        options,
      ),
    });
  };

  componentWillReceiveProps(nextProps: Props): void {
    if (nextProps.files !== this.props.files) {
      this.files = nextProps.files;
      this.sourceFile = this.files[0];
      this.queuePreviewedImageUpdate({ immediate: true });
    }
  }

  componentWillUnmount(): void {
    updateDocumentTitle({ loading: false });
    this.widthQuery.removeListener(this.onMobileWidthChange);
    this.mainAbortController.abort();
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
    this.queuePreviewedImageUpdate();
  }

  private onCopyToOtherClick = async (index: 0 | 1) => {
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
      const newLeftSideSettings = {
        ...this.state.sides[index],
        ...JSON.parse(leftSideSettingsString),
      };
      this.setState({
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
      const newRightSideSettings = {
        ...this.state.sides[index],
        ...JSON.parse(rightSideSettingsString),
      };
      this.setState({
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

    this.setState((state) => ({
      loading: true,
      preprocessorState,
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
   * Queues an update for the currently-previewed image.
   *
   * Debounce the heavy lifting of updateImage.
   * Otherwise, the thrashing causes jank, and sometimes crashes iOS Safari.
   */
  private async queuePreviewedImageUpdate({
    immediate,
  }: {
    immediate?: boolean;
  } = {}): Promise<void> {
    // Call updateImage after this delay, unless queueUpdateImage is called
    // again, in which case the timeout is reset.
    const delay = 100;

    clearTimeout(this.updateImageTimeout);
    if (immediate) {
      this.updateImage();
    } else {
      this.updateImageTimeout = window.setTimeout(
        this.updateImage.bind(this),
        delay,
      );
    }
  }

  /**
   * Process an image immediately.
   *
   * This is a simpler workflow, with no UI state update, no caching, no checking if we need to skip any processing.
   *
   * @param file the file to process
   * @param side the index of the side whose settings we want to use
   * @return the processed file. Null if error
   */
  private async immediateImageUpdate(
    file: File,
    sideIndex: number,
  ): Promise<File | null> {
    const side = this.state.sides[sideIndex];
    const workerBridge = this.workerBridges[0];
    const mainSignal = this.mainAbortController.signal;
    const preprocessor = this.state.preprocessorState;
    const selectedProcessor = side.latestSettings.encoderState
      ? side.latestSettings.processorState
      : defaultProcessorState;
    const selectedEncoder = side.latestSettings.encoderState;

    // No encoder selected, original image
    if (!selectedEncoder) {
      return file;
    }

    try {
      const { decoded, vectorImage } = await decodeImage(
        mainSignal,
        file,
        workerBridge,
      );
      const preprocessed = await preprocessImage(
        mainSignal,
        decoded,
        preprocessor,
        workerBridge,
      );
      const processed = await processImage(
        mainSignal,
        {
          decoded,
          file,
          preprocessed,
          vectorImage,
        },
        selectedProcessor,
        workerBridge,
      );
      const compressedFile = await compressImage(
        mainSignal,
        processed,
        selectedEncoder!,
        file.name,
        workerBridge,
      );

      return compressedFile;
    } catch (e) {
      if (isAbortError(e)) return null;
      // Console instead of snack otherwise this will spam the user's snack feed if there are many errors.
      // when bulk processing
      console.error(`Image processing error: ${e}`);
      throw e;
    }
  }

  /** * All files the user has selected. The first item in this array is the same as the source file upon start. */
  private files: File[];
  /** The main source file for previewing */
  private sourceFile: File;
  /** The in-progress job for decoding and preprocessing */
  private activeMainJob?: MainJob;
  /** The in-progress job for each side (processing and encoding) */
  private activeSideJobs: [SideJob?, SideJob?] = [undefined, undefined];

  /**
   * Perform image processing.
   *
   * This function is a monster, but I didn't want to break it up, because it
   * never gets partially called. Instead, it looks at the current state, and
   * decides which steps can be skipped, and which can be cached.
   */
  private async updateImage() {
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
      // If there isn't an encoder selected, we don't process either
      processorState: side.latestSettings.encoderState
        ? side.latestSettings.processorState
        : defaultProcessorState,
      encoderState: side.latestSettings.encoderState,
    }));

    // Figure out what needs doing:
    const needsDecoding = latestMainJobState.file != mainJobState.file;
    const needsPreprocessing =
      needsDecoding ||
      latestMainJobState.preprocessorState !== mainJobState.preprocessorState;
    const sideWorksNeeded = latestSideJobStates.map((latestSideJob, i) => {
      const needsProcessing =
        needsPreprocessing ||
        !latestSideJob.processorState ||
        // If we're going to or from 'original image' we should reprocess
        !!latestSideJob.encoderState !== !!sideJobStates[i].encoderState ||
        !processorStateEquivalent(
          latestSideJob.processorState,
          sideJobStates[i].processorState,
        );

      return {
        processing: needsProcessing,
        encoding:
          needsProcessing ||
          latestSideJob.encoderState !== sideJobStates[i].encoderState,
      };
    });

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

    // Handle decoding
    if (needsDecoding) {
      try {
        assertSignal(mainSignal);
        this.setState({
          source: undefined,
          loading: true,
        });

        const { decoded: decodedImage, vectorImage: vect } = await decodeImage(
          mainSignal,
          mainJobState.file,
          this.workerBridges[0],
        );
        decoded = decodedImage;
        vectorImage = vect;

        // Set default resize values
        this.setState((currentState) => {
          if (mainSignal.aborted) return {};
          const sides = currentState.sides.map((side) => {
            const resizeState: Partial<ProcessorState['resize']> = {
              width: decoded.width,
              height: decoded.height,
              method: vectorImage ? 'vector' : 'lanczos3',
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
        if (isAbortError(err)) return;
        this.props.showSnack(`Source decoding error: ${err}`);
        throw err;
      }
    } else {
      ({ decoded, vectorImage } = currentState.source!);
    }

    let source: SourceImage;

    // Handle preprocessing
    if (needsPreprocessing) {
      try {
        assertSignal(mainSignal);
        this.setState({
          loading: true,
        });

        const preprocessed = await preprocessImage(
          mainSignal,
          decoded,
          mainJobState.preprocessorState,
          // Either worker is good enough here.
          this.workerBridges[0],
        );

        source = {
          decoded,
          vectorImage,
          preprocessed,
          file: mainJobState.file,
        };

        // Update state for process completion, including intermediate render
        this.setState((currentState) => {
          if (mainSignal.aborted) return {};
          let newState: State = {
            ...currentState,
            loading: false,
            source,
            encodedPreprocessorState: mainJobState.preprocessorState,
            sides: currentState.sides.map((side) => {
              if (side.downloadUrl) URL.revokeObjectURL(side.downloadUrl);

              const newSide: Side = {
                ...side,
                // Intermediate render
                data: preprocessed,
                processed: undefined,
                encodedSettings: undefined,
              };
              return newSide;
            }) as [Side, Side],
          };
          newState = stateForNewSourceData(newState);
          return newState;
        });
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        this.setState({ loading: false });
        this.props.showSnack(`Preprocessing error: ${err}`);
        throw err;
      }
    } else {
      source = currentState.source!;
    }

    // That's the main part of the job done.
    this.activeMainJob = undefined;

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
              processed = await processImage(
                signal,
                source,
                jobState.processorState,
                workerBridge,
              );

              // Update state for process completion, including intermediate render
              this.setState((currentState) => {
                if (signal.aborted) return {};
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
            data = await decodeBitmap(signal, file, workerBridge);

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

        this.setState((currentState) => {
          if (signal.aborted) return {};
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
        });

        this.activeSideJobs[sideIndex] = undefined;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        this.setState((currentState) => {
          const sides = cleanMerge(currentState.sides, sideIndex, {
            loading: false,
          });
          return { sides };
        });
        this.props.showSnack(`Processing error: ${err}`);
        throw err;
      }
    });
  }

  private downloadFromUrl(url: string, fileName: string) {
    let a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', fileName);
    a.setAttribute('target', '_blank');
    a.click();
    a.remove();
  }

  /**
   * Download all using settings from one of the two sides.
   */
  private handleDownloadAll(sideIndex: number) {
    return async () => {
      try {
        let downloadCount = 0;

        const downloadBulk = async (files: Promise<File | null>[]) => {
          if (files.length === 0) return;

          const processed = (await Promise.allSettled(files))
            .map((r) => (r.status === 'fulfilled' ? r.value : null))
            .filter(Boolean) as File[];
          const downloadDetail = processed.map((p) => ({
            url: URL.createObjectURL(p),
            fileName: p.name,
          }));

          for (const { url, fileName } of downloadDetail) {
            this.downloadFromUrl(url, fileName);
            // throttle a bit otherwise the browser won't let us download many files.
            await new Promise((resolve) => setTimeout(resolve, 300));
          }

          downloadDetail.forEach(({ url }) => URL.revokeObjectURL(url));

          downloadCount += downloadDetail.length;
        };

        const BULK_SIZE = 10;
        let promises: Promise<File | null>[] = [];
        for (let i = 0; i < this.files.length; i++) {
          const file = this.files[i];
          const promise = this.immediateImageUpdate(file, sideIndex);
          promises.push(promise);
          if (i % BULK_SIZE === 0) {
            await downloadBulk(promises);
            promises = [];
          }
        }

        // download remaining
        await downloadBulk(promises);

        if (downloadCount === this.files.length) {
          this.props.showSnack('All files have been saved successfully!');
        } else {
          this.props.showSnack('Some files could not be processed');
        }
      } catch (err) {
        console.error('Error saving files:', err);
        this.props.showSnack(
          'There was an error saving the files. Please try again.',
        );
      }
    };
  }

  private onFileChanged(e: Event) {
    const select = e.target as HTMLSelectElement;
    const fileName = select.value;
    const found = this.files.find((f) => f.name === fileName);
    if (!found) {
      console.warn('Could not find the file specified. File name: ' + fileName);
      return;
    }

    this.sourceFile = found;

    this.queuePreviewedImageUpdate({ immediate: true });
  }

  render(
    { onBack }: Props,
    { loading, sides, source, mobileView, preprocessorState }: State,
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
        onEncoderTypeChange={this.onEncoderTypeChange}
        onEncoderOptionsChange={this.onEncoderOptionsChange}
        onProcessorOptionsChange={this.onProcessorOptionsChange}
        onCopyToOtherSideClick={this.onCopyToOtherClick}
        onSaveSideSettingsClick={this.onSaveSideSettingsClick}
        onImportSideSettingsClick={this.onImportSideSettingsClick}
      />
    ));

    const results = sides.map((side, index) => (
      <Fragment key={index}>
        {this.files.length > 1 && (
          <button
            onClick={this.handleDownloadAll(index)}
            class={
              index === 0
                ? style.downloadAllButtonLeft
                : style.downloadAllButtonRight
            }
          >
            {`Download All ${this.files.length} Files `}
          </button>
        )}
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
      </Fragment>
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
        >
          {this.files.length > 1 ? (
            <Select
              style={{
                height: '100%',
              }}
              value={this.sourceFile.name}
              onChange={this.onFileChanged.bind(this)}
            >
              {this.files.map((f, i) => (
                <option value={f.name} key={f.name + i}>
                  {f.name}
                </option>
              ))}
            </Select>
          ) : (
            <Fragment />
          )}
        </Output>
        <div class={style.top}>
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
        </div>
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
