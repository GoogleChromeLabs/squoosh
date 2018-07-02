import { canvasEncode } from '../../lib/util';

export interface EncodeOptions { quality: number; }
export interface EncoderState { type: typeof type; options: EncodeOptions; }

export const type = 'browser-jpeg';
export const label = 'Browser JPEG';
export const mimeType = 'image/jpeg';
export const extension = 'jpg';
export const defaultOptions: EncodeOptions = { quality: 0.5 };

export function encode(data: ImageData, { quality }: EncodeOptions) {
  return canvasEncode(data, mimeType, quality);
}
