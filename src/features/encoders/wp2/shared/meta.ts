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
import type { EncodeOptions } from 'codecs/wp2/enc/wp2_enc';
import { UVMode, Csp } from 'codecs/wp2/enc/wp2_enc';

export { EncodeOptions, UVMode, Csp };

export const label = 'WebP v2 (unstable)';
export const mimeType = 'image/webp2';
export const extension = 'wp2';
export const defaultOptions: EncodeOptions = {
  quality: 75,
  alpha_quality: 75,
  effort: 5,
  pass: 1,
  sns: 50,
  uv_mode: UVMode.UVModeAuto,
  csp_type: Csp.kYCoCg,
  error_diffusion: 0,
  use_random_matrix: false,
};
