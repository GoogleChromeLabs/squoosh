import { defaultOption } from './rotate/processor-meta';

export interface InputProcessorState {
  rotate: import('./rotate/processor-meta').OptionType;
}

export const defaultInputProcessorState: InputProcessorState = {
  rotate: defaultOption,
};
