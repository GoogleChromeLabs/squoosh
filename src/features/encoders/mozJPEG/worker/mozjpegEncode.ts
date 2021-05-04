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
import { MozJPEGModuleExports, EncodeOptions } from '../shared/meta';
import wasmUrl from 'url:codecs/mozjpeg/enc/mozjpeg_enc.wasm';
import { instantiateStreaming } from 'features/worker-utils';
import {
  makeEverythingElseThrow,
  makeWasiEnv,
} from 'features/worker-utils/wasi-utils';

const instancePromise: Promise<WebAssembly.Instance> = instantiateStreaming(
  fetch(wasmUrl),
  {
    wasi_snapshot_preview1: makeEverythingElseThrow(makeWasiEnv()),
  },
).then(({ instance }) => instance);

export default async function encode(
  data: ImageData,
  options: EncodeOptions,
): Promise<ArrayBuffer> {
  const instance = await instancePromise;
  const exports: MozJPEGModuleExports = (instance.exports as unknown) as MozJPEGModuleExports;

  for (const [opt, value] of Object.entries(options)) {
    // @ts-ignore Can’t be bothered to make these typings works
    exports[`set_opts_${opt}`](value);
  }
  const inPtr = exports.alloc(data.data.byteLength);
  new Uint8ClampedArray(exports.memory.buffer, inPtr, data.data.length).set(
    data.data,
  );
  const resultPtr = exports.encode(inPtr, data.width, data.height);
  const dv = new DataView(exports.memory.buffer);
  const length = dv.getUint32(resultPtr, true);
  const outPtr = dv.getUint32(resultPtr + 4, true);
  const result = new Uint8Array(exports.memory.buffer, outPtr, length).slice();
  exports.dealloc(inPtr);
  exports.dealloc(outPtr);
  exports.dealloc(resultPtr);
  // wasm can’t run on SharedArrayBuffers, so we hard-cast to ArrayBuffer.
  return result.buffer;
}
