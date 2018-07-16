import * as browserJPEG from './browser-jpeg/decoder';
import * as browserPNG from './browser-png/decoder';
import * as browserWebP from './browser-webp/decoder';
import * as wasmWebP from './webp/decoder';

import { sniffMimeType } from '../lib/util';

export interface Decoder {
  name: string;
  decode(file: File): Promise<ImageBitmap>;
  isSupported(): Promise<boolean>;
  canHandleMimeType(mimeType: string): boolean;
}

// We load all decoders and filter out the unsupported ones.
export const decodersPromise: Promise<Decoder[]> = Promise.all(
  [
    browserPNG,
    browserJPEG,
    wasmWebP,
    browserWebP,
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

export async function findDecoder(file: File): Promise<Decoder | undefined> {
  const decoders = await decodersPromise;
  const mimeType = await sniffMimeType(file);
  if (!mimeType) {
    return;
  }
  return decoders.find(decoder => decoder.canHandleMimeType(mimeType));
}
