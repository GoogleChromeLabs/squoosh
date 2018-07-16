import { canDecodeImage, fileToBitmap } from '../../lib/util';

export const name = 'Browser JPEG Decoder';
export const supportedExtensions = ['jpg', 'jpeg'];
export const supportedMimeTypes = ['image/jpeg'];
export async function decode(file: File): Promise<ImageBitmap> {
  return fileToBitmap(file);
}

// tslint:disable-next-line:max-line-length It’s a data URL. Whatcha gonna do?
const jpegFile = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AJVAA//Z';

export function isSupported(): Promise<boolean> {
  return canDecodeImage(jpegFile);
}
