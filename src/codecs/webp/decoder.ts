import { blobToArrayBuffer, imageDataToBitmap } from '../../lib/util';
import DecoderWorker  from './Decoder.worker';

export const name = 'WASM WebP Decoder';
export const supportedMimeTypes = ['image/webp'];
export async function decode(file: File): Promise<ImageBitmap> {
  const decoder = await new DecoderWorker();
  const imageData = await decoder.decode(await blobToArrayBuffer(file));
  return imageDataToBitmap(imageData);
}

export async function isSupported(): Promise<boolean> {
  return true;
}

export function canHandleMimeType(mimeType: string): boolean {
  return supportedMimeTypes.includes(mimeType);
}
