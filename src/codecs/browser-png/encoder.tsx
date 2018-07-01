import { canvasEncode } from '../../lib/util';

export interface EncodeOptions {}
export interface EncoderState { type: typeof type; options: EncodeOptions; }

export const type = 'browser-png';
export const label = 'Browser PNG';
export const mimeType = 'image/png';
export const extension = 'png';
export const defaultOptions: EncodeOptions = {};

export function encode(data: ImageData, options: EncodeOptions) {
  return canvasEncode(data, 'image/png');
}
