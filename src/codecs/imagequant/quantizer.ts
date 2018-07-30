import QuantizerWorker from './Quantizer.worker';

export const name = 'Image Quanitzer';
export async function quantize(data: ImageData, opts: QuantizeOptions): Promise<ImageData> {
  const quantizer = await new QuantizerWorker();
  return quantizer.quantize(data, opts);
}

export interface QuantizeOptions {
  maxNumColors: number;
  dither: number;
}

// These come from struct WebPConfig in encode.h.
export const defaultOptions: QuantizeOptions = {
  maxNumColors: 256,
  dither: 1.0,
};
