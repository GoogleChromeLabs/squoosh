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

  // First, let browser fetch and spawn Workers for our pool in the background.
  // This is fairly expensive, so we want to start it as early as possible.
  const workers = Array.from({ length: num }, () => new Worker('./worker', { type: 'module' }));

  // Meanwhile, asynchronously compile, instantiate and initialise Wasm on our main thread.
  await initOxiPNG(fetch(wasmUrl), undefined as any);

  // Get module+memory from the Wasm instance.
  //
  // Ideally we wouldn't go via Wasm bindings here, since both are just JS variables, but memory is
  // currently not exposed on the Wasm instance correctly by wasm-bindgen.
  const workerInit: WorkerInit = worker_initializer(num);

  // Once done, we want to send module+memory to each Worker so that they instantiate Wasm too.
  // While doing so, we need to wait for Workers to acknowledge that they have received our message.
  // Ideally this shouldn't be necessary, but Chromium currently doesn't conform to the spec:
  // https://bugs.chromium.org/p/chromium/issues/detail?id=1075645
  //
  // If we didn't do this ping-pong game, the `start_main_thread` below would block the current
  // thread on an atomic before even *sending* the `postMessage` containing memory,
  // so Workers would never be able to unblock us back.
  await Promise.all(workers.map(worker => initWorker(worker, workerInit)));

  // Finally, instantiate rayon pool - this will use shared Wasm memory to send tasks to the
  // Workers and then block until they're all ready.
  start_main_thread();

  return {
    optimise,
  };
}

export default startMainThread();
