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
} from '../feature-meta';
import { drawableToImageData } from '../util/canvas';
import { BatchItem, BatchItemStatus } from './types';
import { ConcurrencyScheduler, defaultScheduler } from './scheduler';
import { resize } from 'features/processors/resize/client';

export interface BatchProcessorConfig {
  maxRetries: number;
  scheduler: ConcurrencyScheduler;
}

export const DEFAULT_BATCH_PROCESSOR_CONFIG: BatchProcessorConfig = {
  maxRetries: 2,
  scheduler: defaultScheduler,
};

export interface ProcessOptions {
  preprocessorState: PreprocessorState;
  processorState: ProcessorState;
  encoderState?: EncoderState;
}

export interface SourceImage {
  file: File;
  decoded: ImageData;
  preprocessed: ImageData;
  vectorImage?: HTMLImageElement;
}

async function processSvg(
  signal: AbortSignal,
  blob: Blob,
): Promise<HTMLImageElement> {
  assertSignal(signal);
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

async function decodeImage(
  signal: AbortSignal,
  blob: Blob,
  scheduler: ConcurrencyScheduler,
): Promise<ImageData> {
  assertSignal(signal);
  const mimeType = await abortable(signal, sniffMimeType(blob));
  const canDecode = await abortable(signal, canDecodeImageType(mimeType));

  try {
    if (!canDecode) {
      if (mimeType === 'image/avif') {
        const result = await scheduler.submit('avifDecode', signal, [blob]);
        if (!result.success) throw result.error;
        return result.data;
      }
      if (mimeType === 'image/webp') {
        const result = await scheduler.submit('webpDecode', signal, [blob]);
        if (!result.success) throw result.error;
        return result.data;
      }
      if (mimeType === 'image/jxl') {
        const result = await scheduler.submit('jxlDecode', signal, [blob]);
        if (!result.success) throw result.error;
        return result.data;
      }
      if (mimeType === 'image/webp2') {
        const result = await scheduler.submit('wp2Decode', signal, [blob]);
        if (!result.success) throw result.error;
        return result.data;
      }
      if (mimeType === 'image/qoi') {
        const result = await scheduler.submit('qoiDecode', signal, [blob]);
        if (!result.success) throw result.error;
        return result.data;
      }
    }
    return await builtinDecode(signal, blob);
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw err;
    console.log(err);
    throw Error("Couldn't decode image");
  }
}

async function preprocessImage(
  signal: AbortSignal,
  data: ImageData,
  preprocessorState: PreprocessorState,
  scheduler: ConcurrencyScheduler,
): Promise<ImageData> {
  assertSignal(signal);
  let processedData = data;

  if (preprocessorState.rotate.rotate !== 0) {
    const result = await scheduler.submit('rotate', signal, [
      processedData,
      preprocessorState.rotate,
    ]);
    if (!result.success) throw result.error;
    processedData = result.data;
  }

  return processedData;
}

async function processImage(
  signal: AbortSignal,
  source: SourceImage,
  processorState: ProcessorState,
  scheduler: ConcurrencyScheduler,
): Promise<ImageData> {
  assertSignal(signal);
  let result = source.preprocessed;

  if (processorState.resize.enabled) {
    result = await resize(signal, source, processorState.resize, {
      async resize(signal: AbortSignal, ...rest: any[]) {
        const workerResult = await scheduler.submit('resize', signal, rest);
        if (!workerResult.success) throw workerResult.error;
        return workerResult.data;
      },
    } as any);
  }

  if (processorState.quantize.enabled) {
    const workerResult = await scheduler.submit('quantize', signal, [
      result,
      processorState.quantize,
    ]);
    if (!workerResult.success) throw workerResult.error;
    result = workerResult.data;
  }

  return result;
}

async function compressImage(
  signal: AbortSignal,
  image: ImageData,
  encodeData: EncoderState,
  sourceFilename: string,
  scheduler: ConcurrencyScheduler,
): Promise<File> {
  assertSignal(signal);

  const encoder = encoderMap[encodeData.type];
  let compressedData: ArrayBuffer | Blob;

  switch (encodeData.type) {
    case 'mozJPEG':
      const mozResult = await scheduler.submit('mozjpegEncode', signal, [
        image,
        encodeData.options,
      ]);
      if (!mozResult.success) throw mozResult.error;
      compressedData = mozResult.data;
      break;
    case 'avif':
      const avifResult = await scheduler.submit('avifEncode', signal, [
        image,
        encodeData.options,
      ]);
      if (!avifResult.success) throw avifResult.error;
      compressedData = avifResult.data;
      break;
    case 'webP':
      const webpResult = await scheduler.submit('webpEncode', signal, [
        image,
        encodeData.options,
      ]);
      if (!webpResult.success) throw webpResult.error;
      compressedData = webpResult.data;
      break;
    case 'oxiPNG':
      const oxipngResult = await scheduler.submit('oxipngEncode', signal, [
        image,
        encodeData.options,
      ]);
      if (!oxipngResult.success) throw oxipngResult.error;
      compressedData = oxipngResult.data;
      break;
    case 'jxl':
      const jxlResult = await scheduler.submit('jxlEncode', signal, [
        image,
        encodeData.options,
      ]);
      if (!jxlResult.success) throw jxlResult.error;
      compressedData = jxlResult.data;
      break;
    case 'wp2':
      const wp2Result = await scheduler.submit('wp2Encode', signal, [
        image,
        encodeData.options,
      ]);
      if (!wp2Result.success) throw wp2Result.error;
      compressedData = wp2Result.data;
      break;
    case 'qoi':
      const qoiResult = await scheduler.submit('qoiEncode', signal, [
        image,
        encodeData.options,
      ]);
      if (!qoiResult.success) throw qoiResult.error;
      compressedData = qoiResult.data;
      break;
    case 'browserJPEG':
    case 'browserPNG':
    case 'browserGIF':
      compressedData = await encoder.encode(
        signal,
        {} as any,
        image,
        encodeData.options as any,
      );
      break;
    default:
      throw new Error(`Unknown encoder type: ${(encodeData as any).type}`);
  }

  const type: ImageMimeTypes = encoder.meta.mimeType;
  const finalData = compressedData instanceof Blob
    ? new Uint8Array(await compressedData.arrayBuffer())
    : new Uint8Array(compressedData);

  return new File(
    [finalData],
    sourceFilename.replace(/.[^.]*$/, `.${encoder.meta.extension}`),
    { type },
  );
}

export class BatchProcessor {
  private config: BatchProcessorConfig;

  constructor(config: Partial<BatchProcessorConfig> = {}) {
    this.config = { ...DEFAULT_BATCH_PROCESSOR_CONFIG, ...config };
  }

  get scheduler(): ConcurrencyScheduler {
    return this.config.scheduler;
  }

  async processItem(
    item: BatchItem,
    onProgress?: (status: BatchItemStatus, progress: number) => void,
  ): Promise<BatchItem> {
    const signal = new AbortController().signal;
    let vectorImage: HTMLImageElement | undefined;
    let decoded: ImageData;

    try {
      onProgress?.('decoding', 0.1);

      if (item.file.type.startsWith('image/svg+xml')) {
        vectorImage = await processSvg(signal, item.file);
        decoded = drawableToImageData(vectorImage);
      } else {
        decoded = await decodeImage(signal, item.file, this.scheduler);
      }

      onProgress?.('preprocessing', 0.25);

      const preprocessed = await preprocessImage(
        signal,
        decoded,
        item.preprocessorState,
        this.scheduler,
      );

      onProgress?.('processing', 0.4);

      const source: SourceImage = {
        file: item.file,
        decoded,
        preprocessed,
        vectorImage,
      };

      let processed: ImageData = preprocessed;

      if (item.encoderState) {
        processed = await processImage(
          signal,
          source,
          item.processorState,
          this.scheduler,
        );

        onProgress?.('encoding', 0.7);

        const compressedFile = await compressImage(
          signal,
          processed,
          item.encoderState,
          item.file.name,
          this.scheduler,
        );

        const downloadUrl = URL.createObjectURL(compressedFile);

        onProgress?.('completed', 1.0);

        return {
          ...item,
          decoded,
          preprocessed,
          processed,
          compressedFile,
          downloadUrl,
          status: 'completed',
          progress: 1.0,
        };
      } else {
        onProgress?.('completed', 1.0);

        return {
          ...item,
          decoded,
          preprocessed,
          processed,
          status: 'completed',
          progress: 1.0,
        };
      }
    } catch (error) {
      return {
        ...item,
        status: 'failed',
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  createBatchItem(
    file: File,
    options: ProcessOptions,
  ): BatchItem {
    return {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      status: 'pending',
      progress: 0,
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      preprocessorState: options.preprocessorState,
      processorState: options.processorState,
      encoderState: options.encoderState,
    };
  }
}

export const defaultBatchProcessor = new BatchProcessor();
