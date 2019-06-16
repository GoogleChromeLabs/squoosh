import {
  QuantizeOptions, defaultOptions as quantizerDefaultOptions,
} from './imagequant/processor-meta';
import { ResizeOptions, defaultOptions as resizeDefaultOptions } from './resize/processor-meta';
import { HqxOptions, defaultOptions as hqxDefaultOptions } from './hqx/processor-meta';

interface Enableable {
  enabled: boolean;
}
export interface PreprocessorState {
  quantizer: Enableable & QuantizeOptions;
  hqx: Enableable & HqxOptions;
  resize: Enableable & ResizeOptions;
}

export const defaultPreprocessorState: PreprocessorState = {
  quantizer: {
    enabled: false,
    ...quantizerDefaultOptions,
  },
  hqx: {
    enabled: false,
    ...hqxDefaultOptions,
  },
  resize: {
    enabled: false,
    ...resizeDefaultOptions,
  },
};
