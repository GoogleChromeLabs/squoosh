import { canDecode, fileToBitmap } from '../../lib/util';

export const name = 'Browser WebP Decoder';
export const supportedExtensions = ['webp'];
export const supportedMimeTypes = ['image/webp'];
export async function decode(file: File): Promise<ImageBitmap> {
  return fileToBitmap(file);
}

// tslint:disable-next-line:max-line-length It’s a data URL. Whatcha gonna do?
const webpFile = 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAIAAAAAAFZQOCAYAAAAMAEAnQEqAQABAAFAJiWkAANwAP79NmgA';

export function isSupported(): Promise<boolean> {
  return canDecode(webpFile);
}
