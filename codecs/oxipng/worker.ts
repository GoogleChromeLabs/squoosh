/// <reference lib="webworker" />

import initOxiPNG, { start_worker_thread } from './pkg-parallel';

export type WorkerInit = [WebAssembly.Module, WebAssembly.Memory];

// TODO: remove this line.
// It allows main thread to wait for a Worker to be created just to repro a possible V8 bug.
postMessage(null);

addEventListener(
  'message',
  async (event) => {
    // Tell the "main" thread that we've received the message.
    //
    // At this point, the "main" thread can run Wasm that
    // will synchronously block waiting on other atomics.
    //
    // Note that we don't need to wait for Wasm instantiation here - it's
    // better to start main thread as early as possible, and then it blocks
    // on a shared atomic anyway until Worker is fully ready.
    postMessage(null);

    await initOxiPNG(...(event.data as WorkerInit));
    start_worker_thread();
  },
  { once: true },
);
