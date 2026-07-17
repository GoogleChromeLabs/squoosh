import type { PreprocessorState } from '../feature-meta';
import type WorkerBridge from '../worker-bridge';
import { assertSignal } from '../util';

export interface MainJobDescriptor {
  file?: File;
  preprocessorState?: PreprocessorState;
}

export interface MainJobWork {
  decoding: boolean;
  preprocessing: boolean;
}

export interface MainJobSchedulerState {
  active?: MainJobDescriptor;
  completed: MainJobDescriptor;
}

export function mainJobWorkNeeded(
  latest: MainJobDescriptor,
  next: Required<MainJobDescriptor>,
): MainJobWork {
  const decoding = latest.file !== next.file;
  return {
    decoding,
    preprocessing:
      decoding || latest.preprocessorState !== next.preprocessorState,
  };
}

export function mainJobSchedulingDecision(
  state: MainJobSchedulerState,
  next: Required<MainJobDescriptor>,
): MainJobWork {
  return mainJobWorkNeeded(state.active || state.completed, next);
}

/** Rotate is the only shared main preprocessing step. */
export async function preprocessImage(
  signal: AbortSignal,
  data: ImageData,
  preprocessorState: PreprocessorState,
  workerBridge: Pick<WorkerBridge, 'rotate'>,
): Promise<ImageData> {
  assertSignal(signal);
  if (preprocessorState.rotate.rotate === 0) return data;
  return workerBridge.rotate(signal, data, preprocessorState.rotate);
}
