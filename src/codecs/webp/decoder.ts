import { blobToArrayBuffer } from '../../lib/util';
import DecoderWorker  from './Decoder.worker';

export const name = 'WASM WebP Decoder';
export async function decode(blob: Blob): Promise<ImageData> {
  const decoder = await new DecoderWorker();
  return decoder.decode(await blobToArrayBuffer(blob));
}

export async function isSupported(): Promise<boolean> {
  return true;
}

const supportedMimeTypes = ['image/webp'];
export function canHandleMimeType(mimeType: string): boolean {
  return supportedMimeTypes.includes(mimeType);
}
