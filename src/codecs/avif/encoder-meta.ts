export interface EncodeOptions {
  minQuantizer: number;
  maxQuantizer: number;
  minQuantizerAlpha: number;
  maxQuantizerAlpha: number;
  tileRowsLog2: number;
  tileColsLog2: number;
  speed: number;
  subsample: number;
}

export const type = 'avif';
export const label = 'AVIF';
export const mimeType = 'image/avif';
export const extension = 'avif';
export const defaultOptions: EncodeOptions = {
  minQuantizer: 0,
  maxQuantizer: 10,
  minQuantizerAlpha: 0,
  maxQuantizerAlpha: 0,
  tileColsLog2: 0,
  tileRowsLog2: 0,
  speed: 8,
  subsample: 1,
};

export interface EncoderState { type: typeof type; options: EncodeOptions; }
