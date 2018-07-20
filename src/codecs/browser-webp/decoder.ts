import { canDecodeImage, createImageBitmapPolyfill } from '../../lib/util';

export const name = 'Browser WebP Decoder';
export async function decode(blob: Blob): Promise<ImageBitmap> {
  return createImageBitmapPolyfill(blob);
}

// tslint:disable-next-line:max-line-length It’s a data URL. Whatcha gonna do?
const webpFile = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';

export function isSupported(): Promise<boolean> {
  return canDecodeImage(webpFile);
}

const supportedMimeTypes = ['image/webp'];
export function canHandleMimeType(mimeType: string): boolean {
  return supportedMimeTypes.includes(mimeType);
}
