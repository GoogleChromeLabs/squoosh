import { proxy } from 'comlink';
import { QuantizeOptions } from './imagequant/processor-meta';
import { ProcessorWorkerApi } from './processor-worker';
import { canvasEncode, blobToArrayBuffer } from '../lib/util';
import { EncodeOptions as MozJPEGEncoderOptions } from './mozjpeg/encoder-meta';
import { EncodeOptions as OptiPNGEncoderOptions } from './optipng/encoder-meta';
import { EncodeOptions as WebPEncoderOptions } from './webp/encoder-meta';

export default class Processor {
  private _worker?: Worker;
  /** Comlinked worker API */
  private _workerApi?: ProcessorWorkerApi;
  private _abortRejector?: (err: Error) => void;
  private _busy = false;
  private _latestJobId: number = 0;

  /** Decorator that manages the (re)starting of the worker and aborting existing jobs */
  private static _processingJob(
    target: Processor, propertyKey: string, descriptor: PropertyDescriptor,
  ): void {
    const processingFunc = descriptor.value;

    descriptor.value = async function (this: Processor) {
      this._latestJobId += 1;
      const jobId = this._latestJobId;

      if (this._busy) {
        // Abort the current job.
        if (!this._worker || !this._abortRejector) {
          throw Error("There must be a worker/rejector if it's busy");
        }
        this._abortRejector(new DOMException('Aborted', 'AbortError'));
        this._worker.terminate();
        this._worker = undefined;
        this._abortRejector = undefined;
      }

      if (!this._worker) {
        // Webpack's worker loader does magic here.
        // Having to use self.Worker so TypeScript picks up the right type definition
        this._worker = new self.Worker('./processor-worker.ts', { type: 'module' });
        // Need to do some TypeScript trickery to make the type match.
        this._workerApi = proxy(this._worker) as any as ProcessorWorkerApi;
      }

      this._busy = true;

      const returnVal = Promise.race([
        processingFunc(),
        new Promise((_, reject) => { this._abortRejector = reject; }),
      ]);

      // Wait for the operation to settle.
      await returnVal.catch(() => {});

      if (jobId === this._latestJobId) this._busy = false;
      return returnVal;
    };
  }

  @Processor._processingJob
  imageQuant(data: ImageData, opts: QuantizeOptions): Promise<ImageData> {
    return this._workerApi!.quantize(data, opts);
  }

  @Processor._processingJob
  mozjpegEncode(
    data: ImageData, opts: MozJPEGEncoderOptions,
  ): Promise<ArrayBuffer> {
    return this._workerApi!.mozjpegEncode(data, opts);
  }

  @Processor._processingJob
  async optiPngEncode(
    data: ImageData, opts: OptiPNGEncoderOptions,
  ): Promise<ArrayBuffer> {
    // OptiPNG expects PNG input.
    const pngBlob = await canvasEncode(data, 'image/png');
    const pngBuffer = await blobToArrayBuffer(pngBlob);
    return this._workerApi!.optiPngEncode(pngBuffer, opts);
  }

  @Processor._processingJob
  webpEncode(data: ImageData, opts: WebPEncoderOptions): Promise<ArrayBuffer> {
    return this._workerApi!.webpEncode(data, opts);
  }

  @Processor._processingJob
  async webpDecode(blob: Blob): Promise<ImageData> {
    const data = await blobToArrayBuffer(blob);
    return this._workerApi!.webpDecode(data);
  }
}
