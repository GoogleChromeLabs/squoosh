import type { PreprocessorState } from '../feature-meta';
import type WorkerBridge from '../worker-bridge';
import { abortable, assertSignal, sniffMimeType } from '../util';

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
  terminal?: MainJobDescriptor;
  completed: MainJobDescriptor;
}

export interface MainJobSchedulingDecision extends MainJobWork {
  quiescent: boolean;
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

/**
 * Compare a requested main job with active, terminal, or completed work. A
 * terminal request is settled for scheduling purposes, but remains separate
 * from completed output state so failed output is never published.
 */
export function mainJobSchedulingDecision(
  state: MainJobSchedulerState,
  next: Required<MainJobDescriptor>,
): MainJobSchedulingDecision {
  const quiescent =
    !state.active &&
    state.terminal?.file === next.file &&
    state.terminal.preprocessorState === next.preprocessorState;
  const latest = state.active || state.terminal || state.completed;
  return { ...mainJobWorkNeeded(latest, next), quiescent };
}

export function ben2RetryPreprocessorState(
  state: PreprocessorState,
): PreprocessorState {
  return { ...state, ben2: { ...state.ben2 } };
}

export function errorName(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return;
  if (!('name' in error)) return;
  return String((error as { name: unknown }).name);
}

function ben2TerminalError(message: string): Error {
  const error = new Error(message);
  error.name = 'Ben2TerminalError';
  return error;
}

export async function preprocessImage(
  signal: AbortSignal,
  data: ImageData,
  sourceFile: File,
  preprocessorState: PreprocessorState,
  workerBridge: Pick<WorkerBridge, 'pngDecode' | 'rotate' | 'ben2'>,
): Promise<ImageData> {
  assertSignal(signal);
  let processedData = data;

  if (preprocessorState.ben2.enabled) {
    const mimeType = await abortable(signal, sniffMimeType(sourceFile));
    if (mimeType === 'image/png') {
      try {
        processedData = await workerBridge.pngDecode(signal, sourceFile);
      } catch (error) {
        if (errorName(error) === 'AbortError') throw error;
        if (errorName(error) === 'PngModuleLoadError') {
          throw ben2TerminalError('BEN2 PNG decoder assets failed to load');
        }
        throw error;
      }
    }
  }

  if (preprocessorState.rotate.rotate !== 0) {
    processedData = await workerBridge.rotate(
      signal,
      processedData,
      preprocessorState.rotate,
    );
  }

  if (preprocessorState.ben2.enabled) {
    processedData = await workerBridge.ben2(signal, processedData);
  }

  return processedData;
}

export interface PreprocessingJobOptions<T> {
  signal: AbortSignal;
  ben2Enabled: boolean;
  run: () => Promise<T>;
  isCurrent: () => boolean;
  reset: () => Promise<void>;
  publish: (result: T) => void;
  publishTerminal: () => void;
  refreshCacheStatus?: () => Promise<void>;
}

export type PreprocessingJobOutcome = 'published' | 'terminal' | 'stale';

/**
 * Settle one preprocessing request at the publication boundary. Advisory cache
 * inspection is deliberately started only after successful publication and is
 * never part of the request's completion path.
 */
export async function runPreprocessingJob<T>({
  signal,
  ben2Enabled,
  run,
  isCurrent,
  reset,
  publish,
  publishTerminal,
  refreshCacheStatus,
}: PreprocessingJobOptions<T>): Promise<PreprocessingJobOutcome> {
  try {
    const result = await run();
    if (signal.aborted || !isCurrent()) return 'stale';

    publish(result);
    if (ben2Enabled && refreshCacheStatus) {
      void Promise.resolve()
        .then(refreshCacheStatus)
        .catch(() => undefined);
    }
    return 'published';
  } catch (error) {
    if (signal.aborted || errorName(error) === 'AbortError') return 'stale';
    if (errorName(error) !== 'Ben2TerminalError') throw error;

    // run() has settled before reset is invoked. Reset is transport cleanup and
    // must not replace the explicit terminal Retry state if cleanup rejects.
    try {
      await reset();
    } catch {
      // The failed worker is already unusable; terminal UI remains recoverable.
    }
    if (signal.aborted || !isCurrent()) return 'stale';
    publishTerminal();
    return 'terminal';
  }
}

export const BEN2_TERMINAL_MESSAGE =
  'Background removal failed. Reconnect if needed, then retry.';

export function ben2TerminalStatePatch<T extends { loading: boolean }>(
  sides: readonly [T, T],
): {
  loading: false;
  ben2TerminalError: string;
  sides: [T, T];
} {
  return {
    loading: false,
    ben2TerminalError: BEN2_TERMINAL_MESSAGE,
    sides: sides.map((side) => ({
      ...side,
      loading: false,
    })) as [T, T],
  };
}
