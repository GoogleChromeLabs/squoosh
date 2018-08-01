import { QuantizeOptions, defaultOptions as quantizerDefaultOptions } from './imagequant/quantizer';

interface Enableable {
  enabled: boolean;
}
export interface PreprocessorState {
  quantizer: Enableable & QuantizeOptions;
}

export const defaultPreprocessorState = {
  quantizer: {
    enabled: false,
    ...quantizerDefaultOptions,
  },
};
