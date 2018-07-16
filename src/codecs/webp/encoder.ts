import EncoderWorker from './Encoder.worker';

export interface EncodeOptions { quality: number; }
export interface EncoderState { type: typeof type; options: EncodeOptions; }

export const type = 'webp';
export const label = 'WebP';
export const mimeType = 'image/webp';
export const extension = 'webp';
export const defaultOptions: EncodeOptions = { quality: 7 };

export async function encode(data: ImageData, options: EncodeOptions) {
  // We need to await this because it's been comlinked.
  const encoder = await new EncoderWorker();
  return encoder.encode(data, options);
}
