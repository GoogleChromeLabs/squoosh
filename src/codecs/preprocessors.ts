import { QuantizeOptions, defaultOptions as quantizerDefaultOptions } from './imagequant/quantizer';
import { ResizeOptions, defaultOptions as resizeDefaultOptions } from './resize/resize';

interface Enableable {
  enabled: boolean;
}
export interface PreprocessorState {
  quantizer: Enableable & QuantizeOptions;
  resize: Enableable & ResizeOptions;
}

export const defaultPreprocessorState: PreprocessorState = {
  quantizer: {
    enabled: false,
    ...quantizerDefaultOptions,
  },
  resize: {
    enabled: false,
    ...resizeDefaultOptions,
  },
};
