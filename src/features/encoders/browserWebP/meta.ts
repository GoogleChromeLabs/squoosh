export interface EncodeOptions {
  quality: number;
}

export const label = 'Browser WebP';
export const mimeType = 'image/webp';
export const extension = 'webp';
export const defaultOptions: EncodeOptions = { quality: 0.75 };
