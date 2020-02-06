export const name = 'WASM AVIF Decoder';

const supportedMimeTypes = ['image/avif'];

export function canHandleMimeType(mimeType: string): boolean {
  return supportedMimeTypes.includes(mimeType);
}
