import { canvasEncode } from '../../lib/util';
import { canvasEncodeTest } from '../generic/util';

export interface EncodeOptions { }
export interface EncoderState { type: typeof type; options: EncodeOptions; }

export const type = 'browser-bmp';
export const label = 'Browser BMP';
export const mimeType = 'image/bmp';
export const extension = 'bmp';
export const defaultOptions: EncodeOptions = {};
export const featureTest = () => canvasEncodeTest(mimeType);

export function encode(data: ImageData, options: EncodeOptions) {
  return canvasEncode(data, mimeType);
}
