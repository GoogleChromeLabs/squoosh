import { canvasEncode } from '../../lib/util';
import { canvasEncodeTest } from '../generic/util';

export interface EncodeOptions { quality: number; }
export interface EncoderState { type: typeof type; options: EncodeOptions; }

export const type = 'browser-webp';
export const label = 'Browser WebP';
export const mimeType = 'image/webp';
export const extension = 'webp';
export const defaultOptions: EncodeOptions = { quality: 0.5 };
export const featureTest = () => canvasEncodeTest(mimeType);

export function encode(data: ImageData, { quality }: EncodeOptions) {
  return canvasEncode(data, mimeType, quality);
}
