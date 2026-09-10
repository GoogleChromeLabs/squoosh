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
/**
 * Kept as strings rather than the codec's `QuantizeMode` enum: these are
 * persisted in localStorage, and importing the enum would pull the wasm glue
 * into the client bundle. The worker maps them across.
 */
export type QuantizeMode = 'rgba' | 'alphaOnly' | 'zx';

export interface Options {
  mode: QuantizeMode;
  maxNumColors: number;
  dither: number;
  /** 1-10. Higher spends longer for slightly better quality. */
  effort: number;
}

export const defaultOptions: Options = {
  mode: 'rgba',
  maxNumColors: 256,
  // Dithering trades file size for smoother gradients: the noise it adds is
  // expensive to compress. Off by default so the starting point is the smaller
  // file, and turn it up if banding shows.
  dither: 0,
  // Equivalent to libimagequant's own default speed of 4. More effort than this
  // is ~2x the time for ~1% less error, which isn't worth it when every slider
  // drag re-runs the quantizer. The low end is where the real cost is: the
  // three lowest efforts measured 5-9% worse.
  effort: 7,
};
