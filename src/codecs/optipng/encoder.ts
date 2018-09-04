import { canvasEncode, blobToArrayBuffer } from '../../lib/util';
import EncodeWorker from './Encoder.worker';

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

export async function encode(data: ImageData, opts: EncodeOptions): Promise<ArrayBuffer> {
  const pngBlob = await canvasEncode(data, mimeType);
  const pngBuffer = await blobToArrayBuffer(pngBlob);
  const encodeWorker = await new EncodeWorker();
  return encodeWorker.compress(pngBuffer, opts);
}
