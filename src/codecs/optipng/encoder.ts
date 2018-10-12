import { EncoderWorker } from '../codec-worker';
import { canvasEncode, blobToArrayBuffer } from '../../lib/util';

export interface EncodeOptions {
  level: number;
}
export interface EncoderState { type: typeof type; options: EncodeOptions; }

export const type = 'png';
export const label = 'OptiPNG';
export const mimeType = 'image/png';
export const extension = 'png';

export const defaultOptions: EncodeOptions = {
  level: 2,
};

export class Encoder extends EncoderWorker<ImageData, EncodeOptions> {
  protected load(): Worker {
    // TS definitions for Worker incorrectly omit the initialization options dictionary argument.
    // @ts-ignore
    return new Worker('./Encoder.worker', { type: 'module' });
  }

  // convert image data to PNG first.
  protected async preprocess(data: ImageData): Promise<ArrayBuffer> {
    const pngBlob = await canvasEncode(data, mimeType);
    const pngBuffer = await blobToArrayBuffer(pngBlob);
    return pngBuffer;
  }
}
