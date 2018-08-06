import QuantizerWorker from './Quantizer.worker';

export async function quantize(data: ImageData, opts: QuantizeOptions): Promise<ImageData> {
  const quantizer = await new QuantizerWorker();
  return quantizer.quantize(data, opts);
}

export interface QuantizeOptions {
  zx: number;
  maxNumColors: number;
  dither: number;
}

export const defaultOptions: QuantizeOptions = {
  zx: 0,
  maxNumColors: 256,
  dither: 1.0,
};
