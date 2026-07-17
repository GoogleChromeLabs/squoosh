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

export interface MainPreprocessingJobOptions<T> {
  signal: AbortSignal;
  run: () => Promise<T>;
  isCurrent: () => boolean;
  publish: (result: T) => void;
  fail: (error: unknown) => void;
}

export type MainPreprocessingJobOutcome = 'published' | 'stale';

/** Settle shared preprocessing without letting obsolete work mutate UI state. */
export async function runMainPreprocessingJob<T>({
  signal,
  run,
  isCurrent,
  publish,
  fail,
}: MainPreprocessingJobOptions<T>): Promise<MainPreprocessingJobOutcome> {
  try {
    const result = await run();
    if (signal.aborted || !isCurrent()) return 'stale';
    publish(result);
    return 'published';
  } catch (error) {
    const errorName =
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      String((error as { name: unknown }).name);
    if (signal.aborted || !isCurrent() || errorName === 'AbortError') {
      return 'stale';
    }
    fail(error);
    throw error;
  }
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
