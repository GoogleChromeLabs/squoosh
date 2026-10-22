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
import initWasm, {
  quantize as wasmQuantize,
  QuantizeMode as WasmQuantizeMode,
} from 'codecs/imagequant/pkg/squoosh_imagequant';
import { Options, QuantizeMode, defaultOptions } from '../shared/meta';

const modes: Record<QuantizeMode, WasmQuantizeMode> = {
  rgba: WasmQuantizeMode.Rgba,
  alphaOnly: WasmQuantizeMode.AlphaOnly,
  zx: WasmQuantizeMode.Zx,
};

/** Both scales are 1-10, just pointing in opposite directions. */
const MAX_EFFORT = 10;

let wasmReady: Promise<unknown>;

export default async function process(
  data: ImageData,
  opts: Options,
): Promise<ImageData> {
  if (!wasmReady) {
    wasmReady = initWasm();
  }

  await wasmReady;

  // Settings persisted before these options existed won't have them. `mode`
  // replaced a `zx` flag, so old settings fall back to the standard mode.
  const { mode = defaultOptions.mode, effort = defaultOptions.effort } = opts;

  const result = wasmQuantize(
    new Uint8Array(data.data.buffer),
    data.width,
    data.height,
    modes[mode],
    opts.maxNumColors,
    opts.dither,
    // libimagequant counts the other way round: its `speed` runs from 1
    // (slowest, best) to 10 (fastest, worst).
    MAX_EFFORT + 1 - effort,
  );

  return new ImageData(
    new Uint8ClampedArray(result.buffer),
    data.width,
    data.height,
  );
}
