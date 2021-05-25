import { Worker, parentPort } from 'worker_threads';
import { TransformStream } from 'web-streams-polyfill';

function uuid() {
  return Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 256).toString(16),
  ).join('');
}

function jobPromise(worker, msg) {
  return new Promise((resolve, reject) => {
    const id = uuid();
    worker.postMessage({ msg, id });
    worker.on('message', function f({ error, result, id: rid }) {
      if (rid !== id) {
        return;
      }
      if (error) {
        reject(error);
        return;
      }
      worker.off('message', f);
      resolve(result);
    });
  });
}

export default class WorkerPool {
  constructor(numWorkers, workerFile) {
    this.numWorkers = numWorkers;
    this.jobQueue = new TransformStream();
    this.workerQueue = new TransformStream();

    const writer = this.workerQueue.writable.getWriter();
    for (let i = 0; i < numWorkers; i++) {
      writer.write(new Worker(workerFile));
    }
    writer.releaseLock();

    this.done = this._readLoop();
  }

  async _readLoop() {
    const reader = this.jobQueue.readable.getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        await this._terminateAll();
        return;
      }
      const { msg, resolve, reject } = value;
      const worker = await this._nextWorker();
      jobPromise(worker, msg)
        .then((result) => resolve(result))
        .catch((reason) => reject(reason))
        .finally(() => {
          // Return the worker to the pool
          const writer = this.workerQueue.writable.getWriter();
          writer.write(worker);
          writer.releaseLock();
        });
    }
  }

  async _nextWorker() {
    const reader = this.workerQueue.readable.getReader();
    const { value, done } = await reader.read();
    reader.releaseLock();
    return value;
  }

  async _terminateAll() {
    for (let n = 0; n < this.numWorkers; n++) {
      const worker = await this._nextWorker();
      worker.terminate();
    }
    this.workerQueue.writable.close();
  }

  async join() {
    this.jobQueue.writable.getWriter().close();
    await this.done;
  }

  dispatchJob(msg) {
    return new Promise((resolve, reject) => {
      const writer = this.jobQueue.writable.getWriter();
      writer.write({ msg, resolve, reject });
      writer.releaseLock();
    });
  }

  static useThisThreadAsWorker(cb) {
    parentPort.on('message', async (data) => {
      const { msg, id } = data;
      try {
        const result = await cb(msg);
        parentPort.postMessage({ result, id });
      } catch (e) {
        parentPort.postMessage({ error: e.message, id });
      }
    });
  }
}
