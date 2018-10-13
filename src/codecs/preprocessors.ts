import {
  QuantizeOptions, defaultOptions as quantizerDefaultOptions,
} from './imagequant/processor-meta';
import { ResizeOptions, defaultOptions as resizeDefaultOptions } from './resize/processor-meta';

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
