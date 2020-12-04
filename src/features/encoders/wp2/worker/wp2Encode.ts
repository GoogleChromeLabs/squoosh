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
import type { WP2Module } from 'codecs/wp2/enc/wp2_enc';
import type { EncodeOptions } from '../shared/meta';

import { initEmscriptenModule } from 'features/worker-utils';
import { threads, simd } from 'wasm-feature-detect';

import wasmUrl from 'url:codecs/wp2/enc/wp2_enc.wasm';

import wasmUrlWithMT from 'url:codecs/wp2/enc/wp2_enc_mt.wasm';
import workerUrl from 'omt:codecs/wp2/enc/wp2_enc_mt.worker.js';

import wasmUrlWithMTAndSIMD from 'url:codecs/wp2/enc/wp2_enc_mt_simd.wasm';
import workerUrlWithSIMD from 'omt:codecs/wp2/enc/wp2_enc_mt_simd.worker.js';

let emscriptenModule: Promise<WP2Module>;

async function init() {
  if (await threads()) {
    if (await simd()) {
      const wp2Encoder = await import('codecs/wp2/enc/wp2_enc_mt_simd');
      return initEmscriptenModule(
        wp2Encoder.default,
        wasmUrlWithMTAndSIMD,
        workerUrlWithSIMD,
      );
    }
    const wp2Encoder = await import('codecs/wp2/enc/wp2_enc_mt');
    return initEmscriptenModule(
      wp2Encoder.default,
      wasmUrlWithMT,
      workerUrl,
    );
  }
  const wp2Encoder = await import('codecs/wp2/enc/wp2_enc');
  return initEmscriptenModule(
    wp2Encoder.default,
    wasmUrl,
  );
}

export default async function encode(
  data: ImageData,
  options: EncodeOptions,
): Promise<ArrayBuffer> {
  if (!emscriptenModule) emscriptenModule = init();

  const module = await emscriptenModule;
  const result = module.encode(data.data, data.width, data.height, options);

  if (!result) throw new Error('Encoding error.');

  return result.buffer;
}
