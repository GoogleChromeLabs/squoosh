/// <reference lib="webworker" />

import initOxiPNG, { start_worker_thread } from './pkg-parallel';

export type WorkerInit = [WebAssembly.Module, WebAssembly.Memory];

addEventListener(
  'message',
  async (event) => {
    // Tell the "main" thread that we've received the message.
    //
    // At this point, the "main" thread can run Wasm that
    // will synchronously block waiting on other atomics.
    postMessage(null);

    await initOxiPNG(...(event.data as WorkerInit));
    start_worker_thread();
  },
  { once: true },
);
