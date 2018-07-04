import { canDecode, fileToBitmap } from '../../lib/util';

export const name = 'Browser PNG Decoder';
export const supportedExtensions = ['png'];
export const supportedMimeTypes = ['image/png'];
export async function decode(file: File): Promise<ImageBitmap> {
  return fileToBitmap(file);
}

// tslint:disable-next-line:max-line-length It’s a data URL. Whatcha gonna do?
const pngFile = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQYV2NgAAIAAAUAAarVyFEAAAAASUVORK5CYII=';

export function isSupported(): Promise<boolean> {
  return canDecode(pngFile);
}
