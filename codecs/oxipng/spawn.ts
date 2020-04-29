import initOxiPNG, {
  worker_initializer,
  start_main_thread,
  optimise,
} from './pkg-parallel';
import wasmUrl from './pkg-parallel/oxipng_bg.wasm';
import { WorkerInit } from './worker';

function initWorker(worker: Worker, workerInit: WorkerInit) {
  return new Promise((resolve) => {
    worker.postMessage(workerInit);
    worker.addEventListener('message', () => resolve(), { once: true });
  });
}

async function startMainThread() {
  const num = navigator.hardwareConcurrency;
  const workers = Array.from({ length: num }, () => new Worker('./worker', { type: 'module' }));
  await initOxiPNG(fetch(wasmUrl), undefined as any);
  const workerInit: WorkerInit = worker_initializer();
  await Promise.all(workers.map(worker => initWorker(worker, workerInit)));
  start_main_thread(num);
  return {
    optimise,
  };
}

export default startMainThread();
