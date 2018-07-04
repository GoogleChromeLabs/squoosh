import { blobToArrayBuffer, imageDataToBitmap } from '../../lib/util';
import DecoderWorker  from './Decoder.worker';

export const name = 'WASM WebP Decoder';
export const supportedExtensions = ['webp'];
export const supportedMimeTypes = ['image/webp'];
export async function decode(file: File): Promise<ImageBitmap> {
  const decoder = await new DecoderWorker();
  const imageData = await decoder.decode(await blobToArrayBuffer(file));
  return imageDataToBitmap(imageData);
}

export async function isSupported(): Promise<boolean> {
  // TODO(@surma): Should we do wasm detection here or something?
  return true;
}
