import { wrap, Remote } from 'comlink';
import { BridgeMethods, methodNames } from './meta';
import workerURL from 'omt:../../../features-worker';
import type { ProcessorWorkerApi } from '../../../features-worker';
import { abortable } from '../util';

/** How long the worker should be idle before terminating. */
const workerTimeout = 10_000;

interface WorkerBridge extends BridgeMethods {}

class WorkerBridge {
  protected _queue = Promise.resolve() as Promise<unknown>;
  /** Worker instance associated with this processor. */
  protected _worker?: Worker;
  /** Comlinked worker API. */
  protected _workerApi?: Remote<ProcessorWorkerApi>;
  /** ID from setTimeout */
  protected _workerTimeout?: number;

  // New: Lock to prevent race conditions
  private _workerLock = false;
  private _initializing?: Promise<void>;

  protected _terminateWorker() {
    if (!this._worker) return;
    this._worker.terminate();
    this._worker = undefined;
    this._workerApi = undefined;
    this._initializing = undefined;
  }

  protected async _startWorker(): Promise<void> {
    // If already initializing, wait for it
    if (this._initializing) return this._initializing;

    // If worker already exists, do nothing
    if (this._worker && this._workerApi) return;

    // Create initialization promise
    this._initializing = (async () => {
      // Acquire lock
      while (this._workerLock) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      this._workerLock = true;

      try {
        // Double-check after acquiring lock
        if (this._worker && this._workerApi) return;

        this._worker = new Worker(workerURL);
        this._workerApi = wrap<ProcessorWorkerApi>(this._worker);
      } finally {
        this._workerLock = false;
      }
    })();

    return this._initializing;
  }

  protected async _ensureWorker(): Promise<Remote<ProcessorWorkerApi>> {
    await this._startWorker();
    if (!this._workerApi) throw new Error('Failed to initialize worker');
    return this._workerApi;
  }
}

for (const methodName of methodNames) {
  WorkerBridge.prototype[methodName] = function (
    this: WorkerBridge,
    signal: AbortSignal,
    ...args: any
  ) {
    this._queue = this._queue
      // Ignore any errors in the queue
      .catch(() => {})
      .then(async () => {
        if (signal.aborted) throw new DOMException('AbortError', 'AbortError');

        clearTimeout(this._workerTimeout);

        // Use new _ensureWorker method
        const workerApi = await this._ensureWorker();

        const onAbort = () => this._terminateWorker();
        signal.addEventListener('abort', onAbort);

        return abortable(signal, workerApi[methodName](...args) as any).finally(
          () => {
            // No longer care about aborting - this task is complete.
            signal.removeEventListener('abort', onAbort);

            // Start a timer to clear up the worker.
            this._workerTimeout = setTimeout(() => {
              this._terminateWorker();
            }, workerTimeout) as any;
          },
        );
      });

    return this._queue;
  } as any;
}

export default WorkerBridge;
