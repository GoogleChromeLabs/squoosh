export const name = 'WASM WP2 Decoder';

const supportedMimeTypes = ['image/webp2'];

export function canHandleMimeType(mimeType: string): boolean {
  return supportedMimeTypes.includes(mimeType);
}
