import initOxiPNG, { worker_initializer, start_main_thread, optimise } from './pkg/oxipng.js';
import wasmUrl from "./pkg/oxipng_bg.wasm";

async function startMainThread() {
  let num = navigator.hardwareConcurrency;
  await initOxiPNG(fetch(wasmUrl));
  let workerInit = worker_initializer();
  let workers = [];
  for (let i = 0; i < num; i++) {
    workers.push(new Promise(resolve => {
      let worker = new Worker("./worker.js", { type: "module" });
      worker.postMessage(workerInit);
      worker.addEventListener('message', resolve, { once: true });
    }));
  }
  await Promise.all(workers);
  start_main_thread(num);
  return {
    optimise
  };
}

export default startMainThread();
