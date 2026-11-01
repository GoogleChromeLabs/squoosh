import { wrap, type Remote } from 'comlink';
import type { WorkerApi } from './index';
import { abortable } from '@/lib/util';

/** How long the worker should be idle before terminating. */
const workerTimeout = 10_000;

const methodNames = [
  'jxlDecode',
  'qoiDecode',
  'wp2Decode',
  'avifEncode',
  'jxlEncode',
  'mozjpegEncode',
  'oxipngEncode',
  'qoiEncode',
  'webpEncode',
  'wp2Encode',
  'rotate',
  'quantize',
  'resize',
] as const satisfies readonly (keyof WorkerApi)[];

// Fails to compile if a worker method is missing from methodNames.
const allMethodsListed: [
  Exclude<keyof WorkerApi, (typeof methodNames)[number]>,
] extends [never]
  ? true
  : never = true;
void allMethodsListed;

type BridgeMethods = {
  [K in keyof WorkerApi]: (
    signal: AbortSignal,
    ...args: Parameters<WorkerApi[K]>
  ) => ReturnType<WorkerApi[K]>;
};

// Merges with the class below; the methods are added to its prototype.
interface WorkerBridge extends BridgeMethods {}

class WorkerBridge {
  protected _queue = Promise.resolve() as Promise<unknown>;
  /** Worker instance associated with this processor. */
  protected _worker?: Worker;
  /** Comlinked worker API. */
  protected _workerApi?: Remote<WorkerApi>;
  /** ID from setTimeout */
  protected _workerTimeout?: number;

  protected _terminateWorker() {
    if (!this._worker) return;
    this._worker.terminate();
    this._worker = undefined;
    this._workerApi = undefined;
  }

  protected _startWorker() {
    this._worker = new Worker(new URL('./index.ts', import.meta.url), {
      type: 'module',
    });
    this._workerApi = wrap<WorkerApi>(this._worker);
  }
}

for (const methodName of methodNames) {
  WorkerBridge.prototype[methodName] = function (
    this: WorkerBridge,
    signal: AbortSignal,
    ...args: unknown[]
  ) {
    this._queue = this._queue
      // Ignore any errors in the queue
      .catch(() => {})
      .then(async () => {
        if (signal.aborted) throw new DOMException('AbortError', 'AbortError');

        clearTimeout(this._workerTimeout);
        if (!this._worker) this._startWorker();

        const onAbort = () => this._terminateWorker();
        signal.addEventListener('abort', onAbort);

        const method = this._workerApi![methodName] as (
          ...args: unknown[]
        ) => Promise<unknown>;

        return abortable(signal, method(...args)).finally(() => {
          // No longer care about aborting - this task is complete.
          signal.removeEventListener('abort', onAbort);

          // Start a timer to clear up the worker.
          this._workerTimeout = self.setTimeout(() => {
            this._terminateWorker();
          }, workerTimeout);
        });
      });

    return this._queue;
  } as any;
}

export default WorkerBridge;
