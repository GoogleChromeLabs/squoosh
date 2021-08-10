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
import type { AVIFModule } from 'codecs/avif/dec/avif_dec';
import wasmUrl from 'url:codecs/avif/dec/avif_dec.wasm';
import { initEmscriptenModule, blobToArrayBuffer } from 'features/worker-utils';

let emscriptenModule: Promise<AVIFModule>;

export default async function decode(blob: Blob): Promise<ImageData> {
  if (!emscriptenModule) {
    const decoder = await import('codecs/avif/dec/avif_dec');
    emscriptenModule = initEmscriptenModule(decoder.default, wasmUrl);
  }

  const [module, data] = await Promise.all([
    emscriptenModule,
    blobToArrayBuffer(blob),
  ]);

  const result = module.decode(data);
  if (!result) throw new Error('Decoding error');
  return result;
}
