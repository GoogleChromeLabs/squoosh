import {
  QuantizeOptions, defaultOptions as quantizerDefaultOptions,
} from './imagequant/processor-meta';
import { ResizeOptions, defaultOptions as resizeDefaultOptions } from './resize/processor-meta';
import {
  RotateFlipOptions, defaultOptions as rotateFlipDefaultOptions,
} from './rotate-flip/processor-meta';

interface Enableable {
  enabled: boolean;
}
export interface PreprocessorState {
  quantizer: Enableable & QuantizeOptions;
  resize: Enableable & ResizeOptions;
  rotateFlip: Enableable & RotateFlipOptions;
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
  rotateFlip: {
    enabled: false,
    ...rotateFlipDefaultOptions,
  },
};
