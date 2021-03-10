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
import type { EncodeOptions } from 'codecs/avif/enc/avif_enc';

export { EncodeOptions };

export const label = 'AVIF';
export const mimeType = 'image/avif';
export const extension = 'avif';
export const defaultOptions: EncodeOptions = {
  cqLevel: 33,
  minQuantizerAlpha: 0,
  tileColsLog2: 0,
  tileRowsLog2: 0,
  speed: 8,
  subsample: 1,
  chromaDeltaQ: false,
  sharpness: 0,
  targetSsim: false,
};
