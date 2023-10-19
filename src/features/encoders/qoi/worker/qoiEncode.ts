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
import type { QoiModule } from 'codecs/qoi/enc/qoi_enc';
import type { EncodeOptions } from '../shared/meta';
import { initEmscriptenModule } from 'features/worker-utils';

let emscriptenModule: Promise<QoiModule>;

async function init() {
  const qoiEncoder = await import('codecs/qoi/enc/qoi_enc.js');
  return initEmscriptenModule(qoiEncoder.default);
}

export default async function encode(
  data: ImageData,
  options: EncodeOptions,
): Promise<ArrayBuffer> {
  if (!emscriptenModule) {
    emscriptenModule = init();
  }

  const module = await emscriptenModule;
  const resultView = module.encode(data.data, data.width, data.height, options);
  // wasm can’t run on SharedArrayBuffers, so we hard-cast to ArrayBuffer.
  return resultView.buffer as ArrayBuffer;
}
