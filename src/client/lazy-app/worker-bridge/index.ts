import { wrap } from 'comlink';
import { BridgeMethods, methodNames } from './meta';
import workerURL from 'omt:../../../features-worker';
import type { ProcessorWorkerApi } from '../../../features-worker';
import { abortable } from '../util';
import {
  ben2CancellationAudit,
  ben2CancellationReason,
} from '../ben2-cancellation-audit';

/** How long the worker should be idle before terminating. */
const workerTimeout = 10_000;
let nextBridgeId = 0;
let nextWorkerId = 0;

interface WorkerBridge extends BridgeMethods {}

class WorkerBridge {
  protected readonly _auditBridgeId = ++nextBridgeId;
  protected _auditWorkerId?: number;
  protected _queue = Promise.resolve() as Promise<unknown>;
  /** Worker instance associated with this processor. */
  protected _worker?: Worker;
  /** Comlinked worker API. */
  protected _workerApi?: ProcessorWorkerApi;
  /** ID from setTimeout */
  protected _workerTimeout?: number;

  protected _terminateWorker(cause = 'ordinary-idle') {
    if (!this._worker) return;
    ben2CancellationAudit('worker-bridge-terminate', {
      bridgeId: this._auditBridgeId,
      workerId: this._auditWorkerId,
      cause,
      directHarnessTermination: false,
    });
    this._worker.terminate();
    this._worker = undefined;
    this._workerApi = undefined;
    this._auditWorkerId = undefined;
  }

  protected _startWorker() {
    this._worker = new Worker(workerURL);
    this._auditWorkerId = ++nextWorkerId;
    ben2CancellationAudit('worker-bridge-create', {
      bridgeId: this._auditBridgeId,
      workerId: this._auditWorkerId,
      workerURL,
    });
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
      // Ignore any errors in the queue
      .catch(() => {})
      .then(async () => {
        if (signal.aborted) throw new DOMException('AbortError', 'AbortError');

        clearTimeout(this._workerTimeout);
        if (!this._worker) this._startWorker();

        const workerId = this._auditWorkerId;
        ben2CancellationAudit('worker-bridge-call-start', {
          bridgeId: this._auditBridgeId,
          workerId,
          methodName,
          signalAborted: signal.aborted,
        });
        const onAbort = () => {
          ben2CancellationAudit('worker-bridge-abort-listener', {
            bridgeId: this._auditBridgeId,
            workerId,
            methodName,
            signalAborted: signal.aborted,
            signalReason: ben2CancellationReason((signal as any).reason),
          });
          this._terminateWorker('abort-listener');
        };
        signal.addEventListener('abort', onAbort);

        return abortable(
          signal,
          // @ts-ignore - TypeScript can't figure this out
          this._workerApi![methodName](...args),
        ).finally(() => {
          // No longer care about aborting - this task is complete.
          signal.removeEventListener('abort', onAbort);

          // Start a timer to clear up the worker.
          this._workerTimeout = setTimeout(() => {
            this._terminateWorker('ordinary-idle');
          }, workerTimeout);
        });
      });

    return this._queue;
  } as any;
}

export default WorkerBridge;
