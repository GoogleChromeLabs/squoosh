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
import type { MozJPEGModule } from 'codecs/mozjpeg/enc/mozjpeg_enc';
import type { EncodeOptions } from './meta';
import { initEmscriptenModule } from '@/features/worker-utils';

let emscriptenModule: Promise<MozJPEGModule>;

export default async function encode(
  data: ImageData,
  options: EncodeOptions,
): Promise<ArrayBuffer> {
  if (!emscriptenModule) {
    const mozjpegEncoder = await import('codecs/mozjpeg/enc/mozjpeg_enc');
    emscriptenModule = initEmscriptenModule(mozjpegEncoder.default);
  }

  const module = await emscriptenModule;
  const resultView = module.encode(data.data, data.width, data.height, options);
  // wasm can’t run on SharedArrayBuffers, so we hard-cast to ArrayBuffer.
  return resultView.buffer as ArrayBuffer;
}
