import { builtinDecode, sniffMimeType, canDecodeImage } from '../lib/util';
import Processor from './processor';
import webpDataUrl from 'url-loader!./tiny.webp';

const webPSupported = canDecodeImage(webpDataUrl);

export async function decodeImage(blob: Blob, processor: Processor): Promise<ImageData> {
  const mimeType = await sniffMimeType(blob);

  try {
    if (mimeType === 'image/avif') {
      return await processor.avifDecode(blob);
    }
    if (mimeType === 'image/webp' && !(await webPSupported)) {
      return await processor.webpDecode(blob);
    }

    // Otherwise, just throw it at the browser's decoder.
    return await builtinDecode(blob);
  } catch (err) {
    throw Error("Couldn't decode image");
  }
}
