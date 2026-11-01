export interface EncodeOptions {
  quality: number;
}

export const label = 'Browser AVIF';
export const mimeType = 'image/avif';
export const extension = 'avif';
// Not calibrated against a browser that encodes AVIF yet; matches the AVIF
// encoder's default of 50/100.
export const defaultOptions: EncodeOptions = { quality: 0.5 };
