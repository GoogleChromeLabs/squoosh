import * as wasmWebp from './webp/decoder';
import * as browserWebp from './webp/decoder';

import { createImageBitmapPolyfill, sniffMimeType } from '../lib/util';

export interface Decoder {
  name: string;
  decode(blob: Blob): Promise<ImageBitmap>;
  isSupported(): Promise<boolean>;
  canHandleMimeType(mimeType: string): boolean;
}

// We load all decoders and filter out the unsupported ones.
export const decodersPromise: Promise<Decoder[]> = Promise.all(
  [
    browserWebp,
    wasmWebp,
  ]
  .map(async (decoder) => {
    if (await decoder.isSupported()) {
      return decoder;
    }
    return null;
  }),
// TypeScript is not smart enough to realized that I’m filtering all the falsy
// values here.
).then(list => list.filter(item => !!item)) as any as Promise<Decoder[]>;

async function findDecodersByMimeType(mimeType: string): Promise<Decoder[]> {
  const decoders = await decodersPromise;
  return decoders.filter(decoder => decoder.canHandleMimeType(mimeType));
}

export async function decodeImage(blob: Blob): Promise<ImageBitmap> {
  const mimeType = await sniffMimeType(blob);
  const decoders = await findDecodersByMimeType(mimeType);
  if (decoders.length <= 0) {
    // If we can’t find a decoder, hailmary with createImageBitmap
    return createImageBitmapPolyfill(blob);
  }
  for (const decoder of decoders) {
    try {
      return await decoder.decode(blob);
    } catch { }
  }
  throw new Error('No decoder could decode image');
}
