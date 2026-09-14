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
import type { EncodeOptions as CodecEncodeOptions } from 'codecs/jxl/enc/jxl_enc';

/**
 * What the encoder is fed.
 *
 * 'lossy' and 'lossless' both encode pixels. 'transcode' instead recompresses
 * an existing JPEG's DCT coefficients, which keeps the image bit-for-bit
 * identical to the JPEG while making the file smaller - so it's only offered
 * when the source is a JPEG that nothing in the pipeline has touched. See
 * `transcodeSource` in client/lazy-app/Compress.
 */
export type Mode = 'lossy' | 'lossless' | 'transcode';

export interface EncodeOptions extends Omit<CodecEncodeOptions, 'lossless'> {
  mode: Mode;
  /**
   * Whether to store enough data to rebuild the original JPEG file byte for
   * byte. Transcode only; costs a little size.
   */
  storeJpegMetadata: boolean;
  /**
   * Whether to carry the JPEG's Exif/XMP/JUMBF metadata over. Transcode only -
   * it's the one mode where there's any metadata left to keep - and forced on
   * when `storeJpegMetadata` is set.
   */
  keepMetadata: boolean;
}

export const label = 'JPEG XL';
export const mimeType = 'image/jxl';
export const extension = 'jxl';
export const defaultOptions: EncodeOptions = {
  quality: 75,
  qualityAlpha: -1,
  mode: 'lossy',
  effort: 7,
  modular: false,
  progressiveAC: false,
  qProgressiveAC: false,
  progressiveDC: 1,
  groupOrder: 0,
  photonNoiseIso: 0,
  decodingSpeed: 0,
  storeJpegMetadata: true,
  keepMetadata: true,
};
