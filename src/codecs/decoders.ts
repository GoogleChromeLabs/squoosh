import { builtinDecode, sniffMimeType, canDecodeImageType } from '../lib/util';
import Processor from './processor';

export async function decodeImage(blob: Blob, processor: Processor): Promise<ImageData> {
  const mimeType = await sniffMimeType(blob);
  const canDecode = await canDecodeImageType(mimeType);

  try {
    if (!canDecode) {
      if (mimeType === 'image/avif') return await processor.avifDecode(blob);
      if (mimeType === 'image/webp') return await processor.webpDecode(blob);
      // If it's not one of those types, fall through and try built-in decoding for a laugh.
    }
    return await builtinDecode(blob);
  } catch (err) {
    throw Error("Couldn't decode image");
  }
}
