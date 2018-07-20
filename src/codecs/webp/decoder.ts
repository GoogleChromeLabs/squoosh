import { blobToArrayBuffer, imageDataToBitmap } from '../../lib/util';
import DecoderWorker  from './Decoder.worker';

export const name = 'WASM WebP Decoder';
export async function decode(blob: Blob): Promise<ImageBitmap> {
  const decoder = await new DecoderWorker();
  const imageData = await decoder.decode(await blobToArrayBuffer(blob));
  return imageDataToBitmap(imageData);
}

export async function isSupported(): Promise<boolean> {
  return true;
}

const supportedMimeTypes = ['image/webp'];
export function canHandleMimeType(mimeType: string): boolean {
  return supportedMimeTypes.includes(mimeType);
}
