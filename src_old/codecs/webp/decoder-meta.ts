export const name = 'WASM WebP Decoder';

const supportedMimeTypes = ['image/webp'];

export function canHandleMimeType(mimeType: string): boolean {
  return supportedMimeTypes.includes(mimeType);
}
