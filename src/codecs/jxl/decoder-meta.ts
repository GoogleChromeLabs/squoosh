export const name = 'WASM JPEG XL Decoder';

const supportedMimeTypes = ['image/jpegxl'];

export function canHandleMimeType(mimeType: string): boolean {
  return supportedMimeTypes.includes(mimeType);
}
