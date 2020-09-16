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
import webpDecoder, { WebPModule } from 'codecs/webp/dec/webp_dec';
import wasmUrl from 'url:codecs/webp/dec/webp_dec.wasm';
import { initEmscriptenModule } from '../util';

let emscriptenModule: Promise<WebPModule>;

export default async function decode(data: ArrayBuffer): Promise<ImageData> {
  if (!emscriptenModule) {
    emscriptenModule = initEmscriptenModule(webpDecoder, wasmUrl);
  }

  const module = await emscriptenModule;
  return module.decode(data);
}
