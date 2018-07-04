import EncoderWorker from './Encoder.worker';

export interface EncodeOptions { quality: number; }
export interface EncoderState { type: typeof type; options: EncodeOptions; }

export const type = 'mozjpeg';
export const label = 'MozJPEG';
export const mimeType = 'image/jpeg';
export const extension = 'jpg';
export const defaultOptions: EncodeOptions = { quality: 7 };

export async function encode(data: ImageData, options: EncodeOptions) {
  // We need to await this because it's been comlinked.
  const encoder = await new EncoderWorker();
  return encoder.encode(data, options);
}
