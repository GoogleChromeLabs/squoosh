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
import { EncodeOptions } from 'codecs/basis/enc/basis_enc';

export { EncodeOptions };

export const label = 'KTX2 (Basis Universal)';
export const mimeType = 'image/ktx2';
export const extension = 'ktx2';
export const defaultOptions: EncodeOptions = {
  quality: 128,
  compression: 2,
  uastc: false,
  mipmap: false,
};
