import {
  computed,
  markRaw,
  onScopeDispose,
  reactive,
  shallowRef,
  toRaw,
  watch,
  type Ref,
} from 'vue';
import {
  abortable,
  assertSignal,
  blobToImg,
  blobToText,
  builtinDecode,
  canDecodeImageType,
  sniffMimeType,
} from '@/lib/util';
import { drawableToImageData } from '@/lib/canvas';
import type { ShowSnack } from './useSnackbar';
import ResultCache from '@/lib/result-cache';
import WorkerBridge from '@/worker/bridge';
import {
  defaultEncoderState,
  defaultPreprocessorState,
  defaultProcessorState,
  encoderMap,
  isEncoderSupported,
  isEncoderType,
  type EncoderState,
  type EncoderType,
  type PreprocessorState,
  type ProcessorState,
} from '@/features/registry';
import { resize } from '@/features/processors/resize/client';

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

export interface Side {
  /** Settings as edited in the UI. Changed in place. */
  latestSettings: SideSettings;
  /** Settings that produced `data`, once the side's job has finished. */
  encodedSettings?: SideSettings;
  processed?: ImageData;
  file?: File;
  downloadUrl?: string;
  data?: ImageData;
  loading: boolean;
}

export type SideIndex = 0 | 1;

interface Decoded {
  decoded: ImageData;
  vectorImage?: HTMLImageElement;
}

interface SideSnapshot {
  latestSettings: SideSettings;
  encodedSettings?: SideSettings;
  processed?: ImageData;
  file?: File;
  data?: ImageData;
}

const storageKeys = ['leftSideSettings', 'rightSideSettings'] as const;
const sideNames = ['Left', 'Right'] as const;

/** How long to wait for further settings changes before processing. */
const updateDelay = 100;

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}

function clone<T extends object>(value: T): T {
  return structuredClone(toRaw(value));
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
    // Every supported browser decodes AVIF and WebP itself, so only formats
    // that aren't universal yet have wasm fallbacks.
    if (!canDecode) {
      if (mimeType === 'image/jxl') {
        return await workerBridge.jxlDecode(signal, blob);
      }
      if (mimeType === 'image/qoi') {
        return await workerBridge.qoiDecode(signal, blob);
      }
    }
    // Otherwise fall through and try built-in decoding for a laugh.
    return await builtinDecode(signal, blob);
  } catch (err) {
    if (isAbortError(err)) throw err;
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

async function compressImage(
  signal: AbortSignal,
  image: ImageData,
  encoderState: EncoderState,
  sourceFilename: string,
  workerBridge: WorkerBridge,
): Promise<File> {
  assertSignal(signal);

  const encoder = encoderMap[encoderState.type];
  const compressedData = await encoder.encode(
    signal,
    workerBridge,
    image,
    // encoderState.type and .options always belong together.
    encoderState.options as never,
  );

  return new File(
    [compressedData],
    // Swap the extension, or add one if there isn't one.
    sourceFilename.replace(/(\.[^.]*)?$/, `.${encoder.meta.extension}`),
    { type: encoder.meta.mimeType },
  );
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

/**
 * Serializes processor settings. Disabled processors don't change the
 * output, so their options are left out: two states that only differ in the
 * options of disabled processors give the same key.
 */
function processorKey(processorState: ProcessorState): string {
  return JSON.stringify(
    Object.entries(processorState).map(([name, options]) => [
      name,
      options.enabled ? options : false,
    ]),
  );
}

/** Serializes everything that affects a side's output. */
function sideSettingsKey(settings: SideSettings): string {
  // "Original image" ignores the processors.
  if (!settings.encoderState) return 'identity';
  return (
    processorKey(settings.processorState) +
    JSON.stringify(settings.encoderState)
  );
}

/**
 * Turns stored side settings back into valid settings, filling in anything
 * missing and dropping encoders that no longer exist.
 */
function sanitizeSideSettings(stored: unknown): SideSettings | undefined {
  if (!stored || typeof stored !== 'object') return undefined;
  const { processorState, encoderState } = stored as Partial<
    Record<keyof SideSettings, any>
  >;
  const defaults = defaultProcessorState();

  return {
    processorState: {
      resize: { ...defaults.resize, ...processorState?.resize },
      quantize: { ...defaults.quantize, ...processorState?.quantize },
    },
    encoderState:
      isEncoderType(encoderState?.type) && isEncoderSupported(encoderState.type)
        ? ({
            type: encoderState.type,
            options: {
              ...defaultEncoderState(encoderState.type).options,
              ...encoderState.options,
            },
          } as EncoderState)
        : undefined,
  };
}

function readStoredSettings(index: SideIndex): SideSettings | undefined {
  try {
    const stored = localStorage.getItem(storageKeys[index]);
    if (!stored) return undefined;
    return sanitizeSideSettings(JSON.parse(stored).latestSettings);
  } catch {
    return undefined;
  }
}

const loadingIndicator = '⏳ ';
const originalDocumentTitle = document.title;

function updateDocumentTitle(loading: boolean, filename?: string): void {
  let title = '';
  if (loading) title += loadingIndicator;
  if (filename) title += filename + ' - ';
  title += originalDocumentTitle;
  document.title = title;
}

/**
 * The image pipeline behind the editor: decodes `file`, preprocesses it, and
 * processes and encodes it once per side whenever the settings change.
 */
export function useCompressor(
  file: Readonly<Ref<File | undefined>>,
  showSnack: ShowSnack,
) {
  const source = shallowRef<SourceImage>();
  /** Source image decoding and preprocessing */
  const loading = shallowRef(false);
  const preprocessorState = reactive(defaultPreprocessorState());
  const sides = reactive([
    {
      latestSettings: readStoredSettings(0) ?? {
        processorState: defaultProcessorState(),
        encoderState: undefined,
      },
      loading: false,
    },
    {
      latestSettings: readStoredSettings(1) ?? {
        processorState: defaultProcessorState(),
        encoderState: defaultEncoderState('mozJPEG'),
      },
      loading: false,
    },
  ]) as [Side, Side];
  /** Whether each side has settings saved in localStorage. */
  const hasSavedSettings = reactive([
    readStoredSettings(0) !== undefined,
    readStoredSettings(1) !== undefined,
  ]) as [boolean, boolean];

  const isLoading = computed(
    () => loading.value || sides[0].loading || sides[1].loading,
  );

  const encodeCache = new ResultCache();
  // One for each side
  const workerBridges = [new WorkerBridge(), new WorkerBridge()] as const;

  /** Decoding of the current file. Only aborted when the file changes. */
  let decodeJob:
    | { file: File; controller: AbortController; result: Promise<Decoded> }
    | undefined;
  /** Decoding plus preprocessing, the input to both sides. */
  let mainJob:
    | { file: File; preprocessorKey: string; result: Promise<SourceImage> }
    | undefined;
  let mainAbortController = new AbortController();
  const sideAbortControllers = [new AbortController(), new AbortController()];
  /** Settings of each side's latest job, running or finished. */
  const sideJobKeys: [string?, string?] = [];
  /** Each side's last processed image, reused when only the encoder changes. */
  const processedImages: [
    { preprocessed: ImageData; key: string; processed: ImageData }?,
    { preprocessed: ImageData; key: string; processed: ImageData }?,
  ] = [];
  /** For debouncing calls to updateImage. */
  let updateImageTimeout: number | undefined;

  function setSideResult(
    side: Side,
    result: Omit<SideSnapshot, 'latestSettings'>,
  ) {
    if (side.downloadUrl) URL.revokeObjectURL(side.downloadUrl);
    side.downloadUrl = result.file && URL.createObjectURL(result.file);
    side.file = result.file && markRaw(result.file);
    side.data = result.data && markRaw(result.data);
    side.processed = result.processed && markRaw(result.processed);
    side.encodedSettings = result.encodedSettings;
  }

  function snapshotSide(side: Side): SideSnapshot {
    return {
      latestSettings: clone(side.latestSettings),
      encodedSettings: side.encodedSettings && clone(side.encodedSettings),
      processed: side.processed,
      file: side.file,
      data: side.data,
    };
  }

  function applySnapshot(side: Side, snapshot: SideSnapshot) {
    side.latestSettings = clone(snapshot.latestSettings);
    setSideResult(side, snapshot);
  }

  function startDecode(file: File): Promise<Decoded> {
    decodeJob?.controller.abort();
    const controller = new AbortController();
    const { signal } = controller;

    source.value = undefined;
    loading.value = true;

    const result = (async (): Promise<Decoded> => {
      try {
        let decoded: ImageData;
        let vectorImage: HTMLImageElement | undefined;

        // Special-case SVG. We need to avoid createImageBitmap because of
        // https://bugs.chromium.org/p/chromium/issues/detail?id=606319.
        // Also, we cache the HTMLImageElement so we can perform vector resizing later.
        if (file.type.startsWith('image/svg+xml')) {
          vectorImage = markRaw(await processSvg(signal, file));
          decoded = drawableToImageData(vectorImage);
        } else {
          decoded = await decodeImage(signal, file, workerBridges[0]);
        }
        assertSignal(signal);

        // Set default resize values
        for (const side of sides) {
          Object.assign(side.latestSettings.processorState.resize, {
            width: decoded.width,
            height: decoded.height,
            method: vectorImage ? 'vector' : 'lanczos3',
            // Disable resizing, to make it clearer to the user that something changed here
            enabled: false,
          });
        }

        return { decoded: markRaw(decoded), vectorImage };
      } catch (err) {
        if (!isAbortError(err)) {
          loading.value = false;
          showSnack(`Source decoding error: ${err}`);
          console.error(err);
        }
        throw err;
      }
    })();
    // Errors are reported above; this stops unhandled rejection warnings.
    result.catch(() => {});

    decodeJob = { file, controller, result };
    return result;
  }

  async function runMainJob(
    signal: AbortSignal,
    file: File,
    decodeResult: Promise<Decoded>,
    preprocessorState: PreprocessorState,
  ): Promise<SourceImage> {
    loading.value = true;
    // Decoding errors are reported by startDecode.
    const { decoded, vectorImage } = await abortable(signal, decodeResult);

    let preprocessed: ImageData;
    try {
      preprocessed = await preprocessImage(
        signal,
        decoded,
        preprocessorState,
        // Either worker is good enough here.
        workerBridges[0],
      );
      assertSignal(signal);
    } catch (err) {
      if (!isAbortError(err)) {
        loading.value = false;
        showSnack(`Preprocessing error: ${err}`);
        console.error(err);
      }
      throw err;
    }

    const newSource = markRaw({
      file,
      decoded,
      vectorImage,
      preprocessed: markRaw(preprocessed),
    });

    source.value = newSource;
    loading.value = false;
    for (const side of sides) {
      // Ditch previous encodings, and render the source in the meantime.
      setSideResult(side, { data: newSource.preprocessed });
    }

    return newSource;
  }

  async function runSideJob(
    index: SideIndex,
    signal: AbortSignal,
    sourceResult: Promise<SourceImage>,
    settings: SideSettings,
    settingsKey: string,
  ) {
    const side = sides[index];
    const workerBridge = workerBridges[index];

    let source: SourceImage;
    try {
      source = await abortable(signal, sourceResult);
    } catch {
      // Aborted, or failed and reported by the main job.
      return;
    }

    try {
      let file: File;
      let data: ImageData;
      let processed: ImageData | undefined;

      // If there's no encoder state, this is "original image", which also
      // doesn't allow processing.
      if (!settings.encoderState) {
        file = source.file;
        data = source.preprocessed;
      } else {
        const cacheResult = encodeCache.match(source.preprocessed, settingsKey);

        if (cacheResult) {
          ({ file, processed, data } = cacheResult);
        } else {
          side.loading = true;

          const key = processorKey(settings.processorState);
          const previous = processedImages[index];

          if (
            previous &&
            previous.preprocessed === source.preprocessed &&
            previous.key === key
          ) {
            processed = previous.processed;
          } else {
            processed = await processImage(
              signal,
              source,
              settings.processorState,
              workerBridge,
            );
            processedImages[index] = {
              preprocessed: source.preprocessed,
              key,
              processed,
            };
            assertSignal(signal);

            // Intermediate render, keeping the previous file until the new
            // one is ready.
            side.processed = side.data = markRaw(processed);
            side.encodedSettings = {
              ...side.encodedSettings,
              processorState: settings.processorState,
            };
          }

          file = await compressImage(
            signal,
            processed,
            settings.encoderState,
            source.file.name,
            workerBridge,
          );
          data = await decodeImage(signal, file, workerBridge);

          encodeCache.add({
            data,
            processed,
            file,
            preprocessed: source.preprocessed,
            settingsKey,
          });
        }
      }

      assertSignal(signal);
      setSideResult(side, {
        file,
        data,
        processed,
        encodedSettings: settings,
      });
      side.loading = false;
    } catch (err) {
      if (isAbortError(err)) return;
      side.loading = false;
      showSnack(`Processing error: ${err}`);
      console.error(err);
    }
  }

  /**
   * Starts whatever work the current file and settings need, aborting work
   * for outdated settings. Settings are compared by their serialized form,
   * so editing them in place is fine.
   */
  function updateImage() {
    const currentFile = file.value;
    if (!currentFile) return;

    const preprocessorSnapshot = clone(preprocessorState);
    const preprocessorKey = JSON.stringify(preprocessorSnapshot);
    const needsPreprocessing =
      mainJob?.file !== currentFile ||
      mainJob.preprocessorKey !== preprocessorKey;

    if (needsPreprocessing) {
      const decodeResult =
        decodeJob?.file === currentFile
          ? decodeJob.result
          : startDecode(currentFile);

      mainAbortController.abort();
      mainAbortController = new AbortController();
      const result = runMainJob(
        mainAbortController.signal,
        currentFile,
        decodeResult,
        preprocessorSnapshot,
      );
      // Errors are reported in runMainJob.
      result.catch(() => {});
      mainJob = { file: currentFile, preprocessorKey, result };
    }

    for (const index of [0, 1] as const) {
      const settings = clone(sides[index].latestSettings);
      // If there isn't an encoder selected, we don't process either
      if (!settings.encoderState) {
        settings.processorState = defaultProcessorState();
      }
      const settingsKey = sideSettingsKey(settings);
      if (!needsPreprocessing && sideJobKeys[index] === settingsKey) continue;

      sideAbortControllers[index].abort();
      sideAbortControllers[index] = new AbortController();
      sideJobKeys[index] = settingsKey;
      runSideJob(
        index,
        sideAbortControllers[index].signal,
        mainJob!.result,
        settings,
        settingsKey,
      );
    }
  }

  /**
   * Debounce the heavy lifting of updateImage.
   * Otherwise, the thrashing causes jank, and sometimes crashes iOS Safari.
   */
  function queueUpdateImage({ immediate = false } = {}) {
    clearTimeout(updateImageTimeout);
    if (immediate) {
      updateImage();
    } else {
      updateImageTimeout = self.setTimeout(updateImage, updateDelay);
    }
  }

  watch(
    file,
    (newFile) => {
      if (newFile) queueUpdateImage({ immediate: true });
    },
    { immediate: true },
  );
  watch(
    [preprocessorState, () => sides.map((side) => side.latestSettings)],
    () => queueUpdateImage(),
    { deep: true },
  );
  watch(
    [isLoading, () => source.value?.file.name],
    ([isLoading, filename]) => updateDocumentTitle(isLoading, filename),
    { immediate: true },
  );

  onScopeDispose(() => {
    clearTimeout(updateImageTimeout);
    updateDocumentTitle(false);
    decodeJob?.controller.abort();
    mainAbortController.abort();
    for (const controller of sideAbortControllers) controller.abort();
    for (const side of sides) {
      if (side.downloadUrl) URL.revokeObjectURL(side.downloadUrl);
    }
  });

  function setEncoderType(index: SideIndex, type: OutputType) {
    sides[index].latestSettings.encoderState =
      type === 'identity' ? undefined : defaultEncoderState(type);
  }

  function setRotation(rotate: PreprocessorState['rotate']['rotate']) {
    if (!source.value) return;

    const orientationChanged =
      preprocessorState.rotate.rotate % 180 !== rotate % 180;
    preprocessorState.rotate.rotate = rotate;
    loading.value = true;

    // Flip resize values if orientation has changed
    if (orientationChanged) {
      for (const side of sides) {
        const resize = side.latestSettings.processorState.resize;
        [resize.width, resize.height] = [resize.height, resize.width];
      }
    }
  }

  async function copyToOtherSide(index: SideIndex) {
    const otherSide = sides[index ? 0 : 1];
    const oldSnapshot = snapshotSide(otherSide);

    applySnapshot(otherSide, snapshotSide(sides[index]));

    const result = await showSnack('Settings copied across', {
      timeout: 5000,
      actions: ['undo', 'dismiss'],
    });
    if (result === 'undo') applySnapshot(otherSide, oldSnapshot);
  }

  async function saveSideSettings(index: SideIndex) {
    const side = sides[index];
    try {
      localStorage.setItem(
        storageKeys[index],
        JSON.stringify({
          encodedSettings: side.encodedSettings,
          latestSettings: side.latestSettings,
        }),
      );
    } catch (err) {
      showSnack(`Couldn't save settings: ${err}`);
      return;
    }
    hasSavedSettings[index] = true;
    await showSnack(`${sideNames[index]} side settings saved`, {
      timeout: 1500,
      actions: ['dismiss'],
    });
  }

  async function importSideSettings(index: SideIndex) {
    const settings = readStoredSettings(index);
    if (!settings) return;

    const side = sides[index];
    const oldSnapshot = snapshotSide(side);
    side.latestSettings = settings;

    const result = await showSnack(
      `${sideNames[index]} side settings imported`,
      { timeout: 3000, actions: ['undo', 'dismiss'] },
    );
    if (result === 'undo') applySnapshot(side, oldSnapshot);
  }

  return {
    source,
    loading,
    isLoading,
    preprocessorState,
    sides,
    hasSavedSettings,
    setEncoderType,
    setRotation,
    copyToOtherSide,
    saveSideSettings,
    importSideSettings,
  };
}
