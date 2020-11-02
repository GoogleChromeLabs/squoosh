export interface EncodeOptions {
  quality: number;
  alpha_quality: number;
  speed: number;
  pass: number;
  sns: number;
}
export interface EncoderState { type: typeof type; options: EncodeOptions; }

export const type = 'wp2';
export const label = 'WebP 2 (beta)';
export const mimeType = 'image/webp2';
export const extension = 'wp2';
export const defaultOptions: EncodeOptions = {
  quality: 75,
  alpha_quality: 100,
  speed: 5,
  pass: 1,
  sns: 50,
};
