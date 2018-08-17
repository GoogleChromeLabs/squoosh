import EncoderWorker from './Encoder.worker';

export enum MozJpegColorSpace {
  GRAYSCALE = 1,
  RGB,
  YCbCr,
}

export interface EncodeOptions {
  quality: number;
  baseline: boolean;
  arithmetic: boolean;
  progressive: boolean;
  optimize_coding: boolean;
  smoothing: number;
  color_space: MozJpegColorSpace;
  quant_table: number;
  trellis_multipass: boolean;
  trellis_opt_zero: boolean;
  trellis_opt_table: boolean;
  trellis_loops: number;
}

export interface EncoderState { type: typeof type; options: EncodeOptions; }

export const type = 'mozjpeg';
export const label = 'MozJPEG';
export const mimeType = 'image/jpeg';
export const extension = 'jpg';
export const defaultOptions: EncodeOptions = {
  quality: 75,
  baseline: false,
  arithmetic: false,
  progressive: true,
  optimize_coding: true,
  smoothing: 0,
  color_space: MozJpegColorSpace.YCbCr,
  quant_table: 3,
  trellis_multipass: false,
  trellis_opt_zero: false,
  trellis_opt_table: false,
  trellis_loops: 1,
};

export async function encode(data: ImageData, options: EncodeOptions) {
  // We need to await this because it's been comlinked.
  const encoder = await new EncoderWorker();
  return encoder.encode(data, options);
}
