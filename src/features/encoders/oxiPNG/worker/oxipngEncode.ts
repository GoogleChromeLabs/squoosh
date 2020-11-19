/**
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import initOxiWasmST, {
  optimise as optimiseST,
} from 'codecs/oxipng/pkg/squoosh_oxipng';
import initOxiWasmMT, {
  worker_initializer,
  start_main_thread,
  optimise as optimiseMT,
} from 'codecs/oxipng/pkg-parallel/squoosh_oxipng';
import oxiWasmUrlST from 'url:codecs/oxipng/pkg/squoosh_oxipng_bg.wasm';
import oxiWasmUrlMT from 'url:codecs/oxipng/pkg-parallel/squoosh_oxipng_bg.wasm';
import { EncodeOptions } from '../shared/meta';
import { threads } from 'wasm-feature-detect';
import workerURL from 'omt:./sub-worker';
import type { WorkerInit } from './sub-worker';

function initWorker(worker: Worker, workerInit: WorkerInit) {
  return new Promise<void>((resolve) => {
    worker.postMessage(workerInit);
    worker.addEventListener('message', () => resolve(), { once: true });
  });
}

async function initMT() {
  const num = navigator.hardwareConcurrency;

  // First, let browser fetch and spawn Workers for our pool in the background.
  // This is fairly expensive, so we want to start it as early as possible.
  const workers = Array.from({ length: num }, () => new Worker(workerURL));

  // Meanwhile, asynchronously compile, instantiate and initialise Wasm on our main thread.
  await initOxiWasmMT(oxiWasmUrlMT);

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
  await Promise.all(workers.map((worker) => initWorker(worker, workerInit)));

  // Finally, instantiate rayon pool - this will use shared Wasm memory to send tasks to the
  // Workers and then block until they're all ready.
  start_main_thread();

  return optimiseMT;
}

async function initST() {
  await initOxiWasmST(oxiWasmUrlST);
  return optimiseST;
}

let wasmReady: Promise<typeof optimiseMT | typeof optimiseST>;

export default async function encode(
  data: ArrayBuffer,
  options: EncodeOptions,
): Promise<ArrayBuffer> {
  if (!wasmReady) {
    wasmReady = (await threads()) ? initMT() : initST();
  }

  const optimise = await wasmReady;
  return optimise(new Uint8Array(data), options.level).buffer;
}
