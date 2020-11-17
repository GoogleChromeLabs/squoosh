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
import initOxiWasm, { optimise } from 'codecs/oxipng/pkg';
import oxiWasmUrl from 'url:codecs/oxipng/pkg/squoosh_oxipng_bg.wasm';
import { EncodeOptions } from '../shared/meta';

let wasmReady: Promise<unknown>;

export default async function encode(
  data: ArrayBuffer,
  options: EncodeOptions,
): Promise<ArrayBuffer> {
  if (!wasmReady) wasmReady = initOxiWasm(oxiWasmUrl);
  await wasmReady;
  return optimise(new Uint8Array(data), options.level).buffer;
}
