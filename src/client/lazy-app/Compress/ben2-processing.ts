import type {
  EncoderState,
  ProcessorState,
  PreprocessorState,
} from '../feature-meta';
import type WorkerBridge from '../worker-bridge';
import { assertSignal, sniffMimeType } from '../util';
import { resize } from 'features/processors/resize/client';
import type { SideSettings, SourceImage } from '.';

type Ben2Bridge = Pick<WorkerBridge, 'pngDecode' | 'rotate' | 'ben2' | 'reset'>;

interface Ben2Record {
  source: SourceImage;
  controller: AbortController;
  consumers: Set<object>;
  promise: Promise<ImageData>;
  settled: boolean;
  terminal: boolean;
  reset: boolean;
}

export const BEN2_TERMINAL_MESSAGE =
  'Background removal failed. Reconnect if needed, then retry.';

export function errorName(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('name' in error)) return;
  return String((error as { name: unknown }).name);
}

function terminalError(message: string): Error {
  const error = new Error(message);
  error.name = 'Ben2TerminalError';
  return error;
}

function waitForConsumer<T>(
  signal: AbortSignal,
  promise: Promise<T>,
): Promise<T> {
  if (signal.aborted) throw new DOMException('AbortError', 'AbortError');
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(new DOMException('AbortError', 'AbortError'));
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(resolve, reject).finally(() => {
      signal.removeEventListener('abort', onAbort);
    });
  });
}

/**
 * Owns the one BEN2 worker and the one operation for the completed source.
 * This is deliberately a current-value coordinator, not a general result cache.
 */
export class Ben2ProcessingCoordinator {
  private current?: Ben2Record;

  constructor(private readonly bridge: Ben2Bridge) {}

  private createRecord(
    source: SourceImage,
    rotateOptions: PreprocessorState['rotate'],
  ): Ben2Record {
    const controller = new AbortController();
    const record: Ben2Record = {
      source,
      controller,
      consumers: new Set(),
      promise: undefined as unknown as Promise<ImageData>,
      settled: false,
      terminal: false,
      reset: false,
    };

    record.promise = (async () => {
      const signal = controller.signal;
      let input = source.preprocessed;
      if ((await sniffMimeType(source.file)) === 'image/png') {
        try {
          input = await this.bridge.pngDecode(signal, source.file);
        } catch (error) {
          if (errorName(error) === 'PngModuleLoadError') {
            throw terminalError('BEN2 PNG decoder assets failed to load');
          }
          throw error;
        }
        if (rotateOptions.rotate !== 0) {
          input = await this.bridge.rotate(signal, input, rotateOptions);
        }
      }
      return this.bridge.ben2(signal, input);
    })()
      .catch(async (error) => {
        if (errorName(error) === 'AbortError') throw error;

        record.terminal = true;
        record.reset = true;
        try {
          await this.bridge.reset();
        } catch {
          // The terminal result remains retryable even if cleanup fails.
        }
        if (errorName(error) === 'Ben2TerminalError') throw error;
        throw terminalError(
          error instanceof Error ? error.message : String(error),
        );
      })
      .finally(() => {
        record.settled = true;
      });

    return record;
  }

  async acquire(
    source: SourceImage,
    rotateOptions: PreprocessorState['rotate'],
    signal: AbortSignal,
  ): Promise<ImageData> {
    if (signal.aborted) throw new DOMException('AbortError', 'AbortError');
    if (this.current && this.current.source !== source) this.invalidate();
    const record =
      this.current || (this.current = this.createRecord(source, rotateOptions));
    const consumer = {};
    record.consumers.add(consumer);

    try {
      return await waitForConsumer(signal, record.promise);
    } finally {
      record.consumers.delete(consumer);
      if (!record.settled && record.consumers.size === 0) {
        record.controller.abort();
        if (this.current === record) this.current = undefined;
        if (!record.reset) {
          record.reset = true;
          void this.bridge.reset().catch(() => undefined);
        }
      }
    }
  }

  /** Backwards-compatible name for the coordinator's acquisition operation. */
  process(
    source: SourceImage,
    rotateOptions: PreprocessorState['rotate'],
    signal: AbortSignal,
  ): Promise<ImageData> {
    return this.acquire(source, rotateOptions, signal);
  }

  /** Invalidate only a latched terminal result for an explicit side Retry. */
  retry(source: SourceImage): void {
    if (
      this.current?.source === source &&
      this.current.settled &&
      this.current.terminal
    ) {
      this.current = undefined;
    }
  }

  /** Invalidate work when the completed source is replaced or the view leaves. */
  invalidate(): void {
    const record = this.current;
    this.current = undefined;
    if (!record) return;
    if (!record.settled) record.controller.abort();
    if (!record.reset) {
      record.reset = true;
      void this.bridge.reset().catch(() => undefined);
    }
  }
}

export function createBen2Coordinator(
  bridge: Ben2Bridge,
): Ben2ProcessingCoordinator {
  return new Ben2ProcessingCoordinator(bridge);
}

interface PersistedSideSettings {
  latestSettings?: Partial<SideSettings>;
  encodedSettings?: Partial<SideSettings>;
}

/** Add BEN2's default to both old persisted settings slots. */
export function normaliseBen2SideSettings(
  saved: PersistedSideSettings,
  defaults: ProcessorState,
): { latestSettings?: SideSettings; encodedSettings?: SideSettings } {
  const normaliseSlot = (
    slot: Partial<SideSettings> | undefined,
  ): SideSettings | undefined => {
    if (!slot) return;
    return {
      ...slot,
      processorState: {
        ...defaults,
        ...slot.processorState,
        ben2: {
          ...defaults.ben2,
          ...(slot.processorState && slot.processorState.ben2),
        },
      },
    } as SideSettings;
  };

  return {
    latestSettings: normaliseSlot(saved.latestSettings),
    encodedSettings: normaliseSlot(saved.encodedSettings),
  };
}

export function ben2RetryProcessorState(state: ProcessorState): ProcessorState {
  return { ...state, ben2: { ...state.ben2 } };
}

export interface Ben2SideJob {
  processorState: ProcessorState;
  encoderState?: EncoderState;
}

export interface Ben2SideWork {
  processing: boolean;
  encoding: boolean;
}

function processorStateEquivalent(
  left: ProcessorState,
  right: ProcessorState,
): boolean {
  if (left === right) return true;
  for (const key of Object.keys(left) as Array<keyof ProcessorState>) {
    if (!left[key].enabled && !right[key].enabled) continue;
    return false;
  }
  return true;
}

/**
 * Owns the per-side scheduling identities used by Compress. Terminal work is
 * settled but distinct from completed output, so unrelated updates stay idle.
 */
export class Ben2SideJobScheduler {
  private readonly active: [Ben2SideJob?, Ben2SideJob?] = [
    undefined,
    undefined,
  ];
  private readonly terminal: [Ben2SideJob?, Ben2SideJob?] = [
    undefined,
    undefined,
  ];
  private readonly ineffectiveStates = new WeakMap<
    ProcessorState,
    ProcessorState
  >();

  constructor(private readonly defaultProcessorState: ProcessorState) {}

  private effectiveJob(
    settings: SideSettings,
    capability: { state: string },
  ): Ben2SideJob {
    if (!settings.encoderState) {
      return { processorState: this.defaultProcessorState };
    }

    const raw = settings.processorState;
    if (!raw.ben2.enabled || capability.state === 'supported') {
      return { processorState: raw, encoderState: settings.encoderState };
    }

    let ineffective = this.ineffectiveStates.get(raw);
    if (!ineffective) {
      ineffective = {
        ...raw,
        ben2: { ...raw.ben2, enabled: false },
      };
      this.ineffectiveStates.set(raw, ineffective);
    }
    return { processorState: ineffective, encoderState: settings.encoderState };
  }

  plan(
    settings: readonly [SideSettings, SideSettings],
    completed: readonly [SideSettings | undefined, SideSettings | undefined],
    capability: { state: string },
    mainPreprocessing: boolean,
  ): { jobs: [Ben2SideJob, Ben2SideJob]; work: [Ben2SideWork, Ben2SideWork] } {
    const jobs = settings.map((side) =>
      this.effectiveJob(side, capability),
    ) as [Ben2SideJob, Ben2SideJob];
    const work = jobs.map((job, index) => {
      const latest: Partial<Ben2SideJob> =
        this.active[index] || this.terminal[index] || completed[index] || {};
      const processing =
        mainPreprocessing ||
        !latest.processorState ||
        !!latest.encoderState !== !!job.encoderState ||
        !processorStateEquivalent(latest.processorState, job.processorState);
      return {
        processing,
        encoding: processing || latest.encoderState !== job.encoderState,
      };
    }) as [Ben2SideWork, Ben2SideWork];
    return { jobs, work };
  }

  start(index: 0 | 1, job: Ben2SideJob): void {
    this.active[index] = job;
    this.terminal[index] = undefined;
  }

  isCurrent(index: 0 | 1, job: Ben2SideJob, signal: AbortSignal): boolean {
    return !signal.aborted && this.active[index] === job;
  }

  complete(index: 0 | 1, job: Ben2SideJob): boolean {
    if (this.active[index] !== job) return false;
    this.active[index] = undefined;
    return true;
  }

  settleFailure(
    index: 0 | 1,
    job: Ben2SideJob,
    signal: AbortSignal,
    error: unknown,
  ): 'stale' | 'terminal' | 'error' {
    if (
      errorName(error) === 'AbortError' ||
      !this.isCurrent(index, job, signal)
    ) {
      return 'stale';
    }
    this.active[index] = undefined;
    if (errorName(error) === 'Ben2TerminalError') {
      this.terminal[index] = job;
      return 'terminal';
    }
    return 'error';
  }

  clearTerminal(index: 0 | 1): void {
    this.terminal[index] = undefined;
  }

  invalidate(): void {
    this.active[0] = this.active[1] = undefined;
    this.terminal[0] = this.terminal[1] = undefined;
  }

  terminalJob(index: 0 | 1): Ben2SideJob | undefined {
    return this.terminal[index];
  }
}

export function ben2TerminalSideState<T extends { loading: boolean }>(
  side: T,
): T {
  return { ...side, loading: false };
}

export function ben2OptionsDecision({
  sourceHasVector,
  encoderState,
  processorState,
  capability,
}: {
  sourceHasVector: boolean;
  encoderState?: EncoderState;
  processorState: ProcessorState;
  capability: { state: string };
}): { effective: boolean; resizeIsVector: boolean } {
  const effective =
    !!encoderState &&
    processorState.ben2.enabled &&
    capability.state === 'supported';
  return {
    effective,
    resizeIsVector: sourceHasVector && !effective,
  };
}

export function ben2ResizeSource(
  source: SourceImage,
  preprocessed: ImageData,
): SourceImage {
  return { ...source, preprocessed };
}

export function ben2ResizeOptions(
  options: ProcessorState['resize'],
  ben2Effective: boolean,
): ProcessorState['resize'] {
  if (ben2Effective && options.method === 'vector') {
    return {
      ...options,
      method: 'lanczos3',
      premultiply: true,
      linearRGB: true,
    };
  }
  return options;
}

/** Execute the exact per-side BEN2 → Resize → Quantize production route. */
export async function processSideImage(
  signal: AbortSignal,
  source: SourceImage,
  preprocessorState: PreprocessorState,
  processorState: ProcessorState,
  workerBridge: WorkerBridge,
  ben2Coordinator: Pick<Ben2ProcessingCoordinator, 'acquire'>,
  onBen2Completed: () => void,
): Promise<ImageData> {
  assertSignal(signal);
  let processingSource = source;
  let result = source.preprocessed;

  if (processorState.ben2.enabled) {
    result = await ben2Coordinator.acquire(
      source,
      preprocessorState.rotate,
      signal,
    );
    onBen2Completed();
    processingSource = ben2ResizeSource(source, result);
  }
  if (processorState.resize.enabled) {
    result = await resize(
      signal,
      processingSource,
      ben2ResizeOptions(
        processorState.resize,
        processorState.ben2.enabled && !!source.vectorImage,
      ),
      workerBridge,
    );
  }
  if (processorState.quantize.enabled) {
    result = await workerBridge.quantize(
      signal,
      result,
      processorState.quantize,
    );
  }
  return result;
}
