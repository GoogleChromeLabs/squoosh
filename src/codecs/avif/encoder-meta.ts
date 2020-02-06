export interface EncodeOptions {
  minQuantizer: number;
  maxQuantizer: number;
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
  minQuantizer: 16,
  maxQuantizer: 16,
  tileColsLog2: 0,
  tileRowsLog2: 0,
  speed: 10,
  subsample: 0,
};

export interface EncoderState { type: typeof type; options: EncodeOptions; }
