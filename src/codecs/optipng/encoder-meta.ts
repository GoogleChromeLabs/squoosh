export interface EncodeOptions {
  level: number;
}
export interface EncoderState { type: typeof type; options: EncodeOptions; }

export const type = 'png';
export const label = 'OptiPNG';
export const mimeType = 'image/png';
export const extension = 'png';

export const defaultOptions: EncodeOptions = {
  level: 2,
};
