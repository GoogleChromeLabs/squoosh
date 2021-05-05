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
  initThreadPool,
  optimise as optimiseMT,
} from 'codecs/oxipng/pkg-parallel/squoosh_oxipng';
import oxiWasmUrlST from 'url:codecs/oxipng/pkg/squoosh_oxipng_bg.wasm';
import oxiWasmUrlMT from 'url:codecs/oxipng/pkg-parallel/squoosh_oxipng_bg.wasm';
import { EncodeOptions } from '../shared/meta';
import { threads } from 'wasm-feature-detect';

async function initMT() {
  await initOxiWasmMT(oxiWasmUrlMT);
  await initThreadPool(navigator.hardwareConcurrency);
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
    wasmReady = threads().then((hasThreads: boolean) => hasThreads ? initMT() : initST());
  }

  const optimise = await wasmReady;
  return optimise(new Uint8Array(data), options.level).buffer;
}
