import { nativeDecode, sniffMimeType, canDecodeImage } from '../lib/util';
import Processor from './processor';

// tslint:disable-next-line:max-line-length It’s a data URL. Whatcha gonna do?
const webpFile = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
const nativeWebPSupported = canDecodeImage(webpFile);

export async function decodeImage(blob: Blob, processor: Processor): Promise<ImageData> {
  const mimeType = await sniffMimeType(blob);

  try {
    if (mimeType === 'image/webp' && !(await nativeWebPSupported)) {
      return await processor.webpDecode(blob);
    }

    // Otherwise, just throw it at the browser's decoder.
    return await nativeDecode(blob);
  } catch (err) {
    throw Error("Couldn't decode image");
  }
}
