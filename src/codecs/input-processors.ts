import {
  RotateFlipOptions,
  defaultOptions as rotateFlipDefaultOptions,
} from './rotate-flip/processor-meta';

export interface InputProcessorState {
  rotateFlip: RotateFlipOptions;
}

export const defaultInputProcessorState: InputProcessorState = {
  rotateFlip: { ...rotateFlipDefaultOptions },
};
