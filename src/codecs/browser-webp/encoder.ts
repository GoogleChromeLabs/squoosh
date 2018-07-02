import { canvasEncode } from '../../lib/util';

export interface EncodeOptions { quality: number; }
export interface EncoderState { type: typeof type; options: EncodeOptions; }

export const type = 'browser-webp';
export const label = 'Browser WebP';
export const mimeType = 'image/webp';
export const extension = 'webp';
export const defaultOptions: EncodeOptions = { quality: 0.5 };

export async function featureTest() {
  const data = new ImageData(1, 1);
  const blob = await encode(data, defaultOptions);
  if (!blob) return false;
  return blob.type === mimeType;
}

export function encode(data: ImageData, { quality }: EncodeOptions) {
  return canvasEncode(data, mimeType, quality);
}
