import { proxy } from 'comlink';
import { QuantizeOptions } from './imagequant/processor-meta';
import { canvasEncode, blobToArrayBuffer } from '../lib/util';
import { EncodeOptions as MozJPEGEncoderOptions } from './mozjpeg/encoder-meta';
import { EncodeOptions as OxiPNGEncoderOptions } from './oxipng/encoder-meta';
import { EncodeOptions as WebPEncoderOptions } from './webp/encoder-meta';
import { EncodeOptions as WP2EncoderOptions } from './wp2/encoder-meta';
import { EncodeOptions as AvifEncoderOptions } from './avif/encoder-meta';
import { EncodeOptions as JXLEncoderOptions } from './jxl/encoder-meta';
import { EncodeOptions as BrowserJPEGOptions } from './browser-jpeg/encoder-meta';
import { EncodeOptions as BrowserWebpEncodeOptions } from './browser-webp/encoder-meta';
import { BrowserResizeOptions, VectorResizeOptions } from './resize/processor-meta';
import { browserResize, vectorResize } from './resize/processor-sync';
import * as browserBMP from './browser-bmp/encoder';
import * as browserPNG from './browser-png/encoder';
import * as browserJPEG from './browser-jpeg/encoder';
import * as browserWebP from './browser-webp/encoder';
import * as browserGIF from './browser-gif/encoder';
import * as browserTIFF from './browser-tiff/encoder';
import * as browserJP2 from './browser-jp2/encoder';
import * as browserPDF from './browser-pdf/encoder';
import { bind } from '../lib/initial-util';

type ProcessorWorkerApi = import('./processor-worker').ProcessorWorkerApi;

/** How long the worker should be idle before terminating. */
const workerTimeout = 10000;

interface ProcessingJobOptions {
  needsWorker?: boolean;
}

export default class Processor {
  /** Worker instance associated with this processor. */
  private _worker?: Worker;
  /** Comlinked worker API. */
  private _workerApi?: ProcessorWorkerApi;
  /** Rejector for a pending promise. */
  private _abortRejector?: (err: Error) => void;
  /** Is work currently happening? */
  private _busy = false;
  /** Incementing ID so we can tell if a job has been superseded. */
  private _latestJobId: number = 0;
  /** setTimeout ID for killing the worker when idle. */
  private _workerTimeoutId: number = 0;

  /**
   * Decorator that manages the (re)starting of the worker and aborting existing jobs. Not all
   * processing jobs require a worker (e.g. the main thread canvas encodes), use the needsWorker
   * option to control this.
   */
  private static _processingJob(options: ProcessingJobOptions = {}) {
    const { needsWorker = false } = options;

    return (target: Processor, propertyKey: string, descriptor: PropertyDescriptor): void => {
      const processingFunc = descriptor.value;

      descriptor.value = async function (this: Processor, ...args: any[]) {
        this._latestJobId += 1;
        const jobId = this._latestJobId;
        this.abortCurrent();

        if (needsWorker) self.clearTimeout(this._workerTimeoutId);

        if (!this._worker && needsWorker) {
          // worker-loader does magic here.
          this._worker = new Worker(
            './processor-worker',
            { name: 'processor-worker', type: 'module' },
          );
          // Need to do some TypeScript trickery to make the type match.
          this._workerApi = proxy(this._worker) as any as ProcessorWorkerApi;
        }

        this._busy = true;

        const returnVal = Promise.race([
          processingFunc.call(this, ...args),
          new Promise((_, reject) => { this._abortRejector = reject; }),
        ]);

        // Wait for the operation to settle.
        await returnVal.catch(() => {});

        // If no other jobs are happening, cleanup.
        if (jobId === this._latestJobId) this._jobCleanup();

        return returnVal;
      };
    };
  }

  private _jobCleanup(): void {
    this._busy = false;

    if (!this._worker) return;

    // If the worker is unused for 10 seconds, remove it to save memory.
    this._workerTimeoutId = self.setTimeout(this.terminateWorker, workerTimeout);
  }

  /** Abort the current job, if any */
  abortCurrent() {
    if (!this._busy) return;
    if (!this._abortRejector) throw Error("There must be a rejector if it's busy");
    this._abortRejector(new DOMException('Aborted', 'AbortError'));
    this._abortRejector = undefined;
    this._busy = false;
    this.terminateWorker();
  }

  @bind
  terminateWorker() {
    if (!this._worker) return;
    // this._worker.terminate();
    this._worker = undefined;
  }

  // Off main thread jobs:
  @Processor._processingJob({ needsWorker: true })
  imageQuant(data: ImageData, opts: QuantizeOptions): Promise<ImageData> {
    return this._workerApi!.quantize(data, opts);
  }

  @Processor._processingJob({ needsWorker: true })
  rotate(
    data: ImageData, opts: import('./rotate/processor-meta').RotateOptions,
  ): Promise<ImageData> {
    return this._workerApi!.rotate(data, opts);
  }

  @Processor._processingJob({ needsWorker: true })
  workerResize(
    data: ImageData, opts: import('./resize/processor-meta').WorkerResizeOptions,
  ): Promise<ImageData> {
    return this._workerApi!.resize(data, opts);
  }

  @Processor._processingJob({ needsWorker: true })
  mozjpegEncode(
    data: ImageData, opts: MozJPEGEncoderOptions,
  ): Promise<ArrayBuffer> {
    return this._workerApi!.mozjpegEncode(data, opts);
  }

  @Processor._processingJob({ needsWorker: true })
  async oxiPngEncode(
    data: ImageData, opts: OxiPNGEncoderOptions,
  ): Promise<ArrayBuffer> {
    // OxiPNG expects PNG input.
    const pngBlob = await canvasEncode(data, 'image/png');
    const pngBuffer = await blobToArrayBuffer(pngBlob);
    return this._workerApi!.oxiPngEncode(pngBuffer, opts);
  }

  @Processor._processingJob({ needsWorker: true })
  webpEncode(data: ImageData, opts: WebPEncoderOptions): Promise<ArrayBuffer> {
    return this._workerApi!.webpEncode(data, opts);
  }

  @Processor._processingJob({ needsWorker: true })
  wp2Encode(data: ImageData, opts: WP2EncoderOptions): Promise<ArrayBuffer> {
    return this._workerApi!.wp2Encode(data, opts);
  }

  @Processor._processingJob({ needsWorker: true })
  async webpDecode(blob: Blob): Promise<ImageData> {
    const data = await blobToArrayBuffer(blob);
    return this._workerApi!.webpDecode(data);
  }

  @Processor._processingJob({ needsWorker: true })
  async wp2Decode(blob: Blob): Promise<ImageData> {
    const data = await blobToArrayBuffer(blob);
    return this._workerApi!.wp2Decode(data);
  }

  @Processor._processingJob({ needsWorker: true })
  async avifDecode(blob: Blob): Promise<ImageData> {
    const data = await blobToArrayBuffer(blob);
    return this._workerApi!.avifDecode(data);
  }

  @Processor._processingJob({ needsWorker: true })
  avifEncode(data: ImageData, opts: AvifEncoderOptions): Promise<ArrayBuffer> {
    return this._workerApi!.avifEncode(data, opts);
  }

  @Processor._processingJob({ needsWorker: true })
  jxlEncode(data: ImageData, opts: JXLEncoderOptions): Promise<ArrayBuffer> {
    return this._workerApi!.jxlEncode(data, opts);
  }

  @Processor._processingJob({ needsWorker: true })
  async jxlDecode(blob: Blob): Promise<ImageData> {
    const data = await blobToArrayBuffer(blob);
    return this._workerApi!.jxlDecode(data);
  }

  // Not-worker jobs:

  @Processor._processingJob()
  browserBmpEncode(data: ImageData): Promise<Blob> {
    return browserBMP.encode(data);
  }

  @Processor._processingJob()
  browserPngEncode(data: ImageData): Promise<Blob> {
    return browserPNG.encode(data);
  }

  @Processor._processingJob()
  browserJpegEncode(data: ImageData, opts: BrowserJPEGOptions): Promise<Blob> {
    return browserJPEG.encode(data, opts);
  }

  @Processor._processingJob()
  browserWebpEncode(data: ImageData, opts: BrowserWebpEncodeOptions): Promise<Blob> {
    return browserWebP.encode(data, opts);
  }

  @Processor._processingJob()
  browserGifEncode(data: ImageData): Promise<Blob> {
    return browserGIF.encode(data);
  }

  @Processor._processingJob()
  browserTiffEncode(data: ImageData): Promise<Blob> {
    return browserTIFF.encode(data);
  }

  @Processor._processingJob()
  browserJp2Encode(data: ImageData): Promise<Blob> {
    return browserJP2.encode(data);
  }

  @Processor._processingJob()
  browserPdfEncode(data: ImageData): Promise<Blob> {
    return browserPDF.encode(data);
  }

  // Synchronous jobs

  resize(data: ImageData, opts: BrowserResizeOptions) {
    this.abortCurrent();
    return browserResize(data, opts);
  }

  vectorResize(data: HTMLImageElement, opts: VectorResizeOptions) {
    this.abortCurrent();
    return vectorResize(data, opts);
  }
}
