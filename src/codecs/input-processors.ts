import { defaultOptions as rotateDefaultOptions } from './rotate/processor-meta';

export interface InputProcessorState {
  rotate: import('./rotate/processor-meta').RotateFlipOptions;
}

export const defaultInputProcessorState: InputProcessorState = {
  rotate: rotateDefaultOptions,
};
