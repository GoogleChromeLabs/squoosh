import * as browserJPEG from './browser-jpeg/decoder';
import * as browserPNG from './browser-png/decoder';
import * as browserWebP from './browser-webp/decoder';
import * as wasmWebP from './webp/decoder';

export interface Decoder {
  name: string;
  decode(file: File): Promise<ImageBitmap>;
  isSupported(): Promise<boolean>;
  supportedMimeTypes: string[];
  supportedExtensions: string[];
}

// We load all decoders and filter out the unsupported ones.
export const decodersPromise: Promise<Decoder[]> = Promise.all(
  [
    browserPNG,
    browserJPEG,
    wasmWebP,
    browserWebP,
  ]
  .map(async (encoder) => {
    if (await encoder.isSupported()) {
      return encoder;
    }
    return null;
  }),
// TypeScript is not smart enough to realized that I’m filtering all the falsy
// values here.
).then(list => list.filter(item => !!item)) as any as Promise<Decoder[]>;

export async function findDecoder(file: File): Promise<Decoder | undefined> {
  const decoders = await decodersPromise;
  // Prefer a match on mime type over a match on file extension
  const decoder = decoders.find(decoder => decoder.supportedMimeTypes.includes(file.type));
  if (decoder) {
    return decoder;
  }
  return decoders.find(decoder =>
    decoder.supportedExtensions.some(extension =>
       file.name.endsWith(`.${extension}`)));
}
