import { Worker, parentPort } from 'worker_threads';
import { TransformStream } from 'web-streams-polyfill';

function uuid() {
  return Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 256).toString(16),
  ).join('');
}

function jobPromise(worker, msg) {
  return new Promise((resolve) => {
    const id = uuid();
    worker.postMessage({ msg, id });
    worker.on('message', function f({ result, id: rid }) {
      if (rid !== id) {
        return;
      }
      worker.off('message', f);
      resolve(result);
    });
    worker.on('error', (error) => console.error('Worker error: ', error));
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
      const { msg, resolve } = value;
      const worker = await this._nextWorker();
      jobPromise(worker, msg).then((result) => {
        resolve(result);
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
    return new Promise((resolve) => {
      const writer = this.jobQueue.writable.getWriter();
      writer.write({ msg, resolve });
      writer.releaseLock();
    });
  }

  static useThisThreadAsWorker(cb) {
    parentPort.on('message', async (data) => {
      const { msg, id } = data;
      const result = await cb(msg);
      parentPort.postMessage({ result, id });
    });
  }
}
