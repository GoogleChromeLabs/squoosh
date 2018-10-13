export const name = 'WASM WebP Decoder';
export async function isSupported(): Promise<boolean> {
  return true;
}

const supportedMimeTypes = ['image/webp'];
export function canHandleMimeType(mimeType: string): boolean {
  return supportedMimeTypes.includes(mimeType);
}
