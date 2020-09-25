import { wrap } from 'comlink';
import { BridgeMethods, methodNames } from './meta';
import workerURL from 'omt:../index';
import type { ProcessorWorkerApi } from '../';
import { abortable } from '../../../client/lazy-app/util';

/** How long the worker should be idle before terminating. */
const workerTimeout = 10000;

interface WorkerBridge extends BridgeMethods {}

class WorkerBridge {
  protected _queue = Promise.resolve() as Promise<unknown>;
  /** Worker instance associated with this processor. */
  protected _worker?: Worker;
  /** Comlinked worker API. */
  protected _workerApi?: ProcessorWorkerApi;

  protected _terminateWorker() {
    if (!this._worker) return;
    this._worker.terminate();
    this._worker = undefined;
    this._workerApi = undefined;
  }

  protected _startWorker() {
    this._worker = new Worker(workerURL);
    this._workerApi = wrap<ProcessorWorkerApi>(this._worker);
  }
}

for (const methodName of methodNames) {
  WorkerBridge.prototype[methodName] = function (
    this: WorkerBridge,
    signal: AbortSignal,
    ...args: any
  ) {
    this._queue = this._queue
      .catch(() => {})
      .then(async () => {
        if (signal.aborted) throw new DOMException('AbortError', 'AbortError');
        let done = false;

        signal.addEventListener('abort', () => {
          if (done) return;
          this._terminateWorker();
        });

        if (!this._worker) this._startWorker();

        const timeoutId = setTimeout(() => {
          this._terminateWorker();
        }, workerTimeout);

        return abortable(signal, this._workerApi![methodName]() as any).finally(
          () => {
            done = true;
            clearTimeout(timeoutId);
          },
        );
      });
  } as any;
}

export default WorkerBridge;
