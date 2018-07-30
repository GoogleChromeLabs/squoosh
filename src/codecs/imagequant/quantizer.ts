import QuantizerWorker from './Quantizer.worker';

export const name = 'Image Quanitzer';
export async function quantize(data: ImageData): Promise<ImageData> {
  const quantizer = await new QuantizerWorker();
  return quantizer.quantize(data);
}
