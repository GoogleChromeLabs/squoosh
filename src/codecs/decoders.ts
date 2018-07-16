import * as wasmWebP from './webp/decoder';
import * as browserWebP from './browser-webp/decoder';

import { createImageBitmapPolyfill, sniffMimeType } from '../lib/util';

export interface Decoder {
  name: string;
  decode(file: File): Promise<ImageBitmap>;
  isSupported(): Promise<boolean>;
  canHandleMimeType(mimeType: string): boolean;
}

// We load all decoders and filter out the unsupported ones.
export const decodersPromise: Promise<Decoder[]> = Promise.all(
  [
    browserWebP,
    wasmWebP,
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

const nativelySupportedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
];

export async function decodeFile(file: File): Promise<ImageBitmap> {
  const mimeType = await sniffMimeType(file);
  if (!mimeType) {
    throw new Error('Could not determine mime type');
  }
  if (nativelySupportedMimeTypes.includes(mimeType)) {
    return createImageBitmapPolyfill(file);
  }
  const decoder = await findDecoder(file);
  if (!decoder) {
    throw new Error(`Can’t decode files with mime type ${mimeType}`);
  }
  console.log(`Going with ${decoder.name}`);
  return decoder.decode(file);
}
