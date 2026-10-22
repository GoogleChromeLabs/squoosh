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
import type { JXLModule } from 'codecs/jxl/enc/jxl_enc';

import { initEmscriptenModule } from 'features/worker-utils';

let emscriptenModule: Promise<JXLModule> | undefined;

/**
 * The JPEG XL encoder wasm module, instantiated once per worker.
 *
 * This lives outside `worker/` because every file in there becomes its own
 * worker method, and both of this codec's methods (jxlEncode and jxlTranscode)
 * drive the same module. Holding it in either of them would mean two wasm
 * instances - and two preloaded pthread pools - in the same worker as soon as
 * someone switched between transcode and the other modes.
 */
export function getEncoderModule(): Promise<JXLModule> {
  if (!emscriptenModule) {
    emscriptenModule = (async () => {
      // Single SIMD build, no threads. All modern browsers support WebAssembly
      // SIMD, and libjxl benefits far more from SIMD than from worker threads.
      const jxlEncoder = await import('codecs/jxl/enc/jxl_enc');
      return initEmscriptenModule(jxlEncoder.default);
    })();
  }
  return emscriptenModule;
}
