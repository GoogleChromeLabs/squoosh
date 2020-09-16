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
