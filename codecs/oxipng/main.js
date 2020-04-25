import initOxiPNG, { start_main_thread, optimise } from './pkg/squoosh_oxipng.js';
import wasmUrl from "./pkg/squoosh_oxipng_bg.wasm";

async function startMainThread() {
  await initOxiPNG(fetch(wasmUrl));
  start_main_thread({
    length: navigator.hardwareConcurrency,
    pop: () => ({
      postMessage: data => {
        postMessage({ type: 'spawn', data });
      }
    })
  });
  return {
    optimise
  };
}

const mainThread = startMainThread();
addEventListener('message', async ({ data: { id, args } }) => {
  try {
    let result = (await mainThread).optimise(...args);
    postMessage({ ok: true, id, result });
  } catch (result) {
    postMessage({ ok: false, id, result });
  }
});
