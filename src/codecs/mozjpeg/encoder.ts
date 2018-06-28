import Encoder from './encoder.worker';

export interface EncodeOptions { quality?: number; }
export interface EncoderState { type: typeof type; options: EncodeOptions; }

export const type = 'mozjpeg';
export const label = 'MozJPEG';
export const mimeType = 'image/jpeg';
export const extension = 'jpg';
export const defaultOptions: EncodeOptions = { quality: 7 };

export async function encode(data: ImageData, options: EncodeOptions = {}) {
  // This is horrible because TypeScript doesn't realise that
  // Encoder has been comlinked.
  const encoder = new Encoder() as any as Promise<Encoder>;
  return (await encoder).encode(data, options);
}
