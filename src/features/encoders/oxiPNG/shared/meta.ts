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
export interface EncodeOptions {
  /**
   * 0-6 are oxipng's own presets. 7 is ours: preset 6 deflated with Zopfli -
   * smaller, and much slower. See codecs/oxipng/src/lib.rs for why Zopfli is
   * the top of this scale rather than an independent toggle.
   */
  level: number;
  interlace: boolean;
  /**
   * Keep the colour channels of fully-transparent pixels. Off (the default)
   * lets oxipng rewrite them to whatever compresses best - invisible when
   * composited normally, but destructive.
   */
  preserveAlpha: boolean;
}

export const label = 'OxiPNG';
export const mimeType = 'image/png';
export const extension = 'png';

export const defaultOptions: EncodeOptions = {
  level: 2,
  interlace: false,
  preserveAlpha: false,
};
