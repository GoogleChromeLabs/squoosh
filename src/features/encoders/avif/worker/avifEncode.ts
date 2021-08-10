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
import type { AVIFModule } from 'codecs/avif/enc/avif_enc';
import type { EncodeOptions } from '../shared/meta';
import wasmUrlWithoutMT from 'url:codecs/avif/enc/avif_enc.wasm';
import wasmUrlWithMT from 'url:codecs/avif/enc/avif_enc_mt.wasm';
import workerUrl from 'omt:codecs/avif/enc/avif_enc_mt.worker.js';
import { initEmscriptenModule } from 'features/worker-utils';
import { threads } from 'wasm-feature-detect';

let emscriptenModule: Promise<AVIFModule>;

async function init() {
  if (await threads()) {
    const avifEncoder = await import('codecs/avif/enc/avif_enc_mt');
    return initEmscriptenModule<AVIFModule>(
      avifEncoder.default,
      wasmUrlWithMT,
      workerUrl,
    );
  }
  const avifEncoder = await import('codecs/avif/enc/avif_enc.js');
  return initEmscriptenModule(avifEncoder.default, wasmUrlWithoutMT);
}

export default async function encode(
  data: ImageData,
  options: EncodeOptions,
): Promise<ArrayBuffer> {
  if (!emscriptenModule) emscriptenModule = init();

  const module = await emscriptenModule;
  const result = module.encode(data.data, data.width, data.height, options);

  if (!result) throw new Error('Encoding error');

  return result.buffer;
}
