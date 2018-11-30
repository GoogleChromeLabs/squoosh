import { defaultOptions as rotateDefaultOptions } from './rotate/processor-meta';

export interface InputProcessorState {
  rotate: import('./rotate/processor-meta').RotateOptions;
}

export const defaultInputProcessorState: InputProcessorState = {
  rotate: rotateDefaultOptions,
};
