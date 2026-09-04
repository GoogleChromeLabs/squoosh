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
import {
  EncodeOptions,
  AVIFTune,
  AVIFTiling,
} from 'codecs/avif/enc/avif_enc_mt';

export { EncodeOptions, AVIFTune, AVIFTiling };

export const label = 'AVIF';
export const mimeType = 'image/avif';
export const extension = 'avif';
export const defaultOptions: EncodeOptions = {
  quality: 50,
  qualityAlpha: -1,
  denoiseLevel: 0,
  speed: 6,
  subsample: 1,
  aqMode: 0,
  tune: AVIFTune.auto,
  enableSharpYUV: false,
  channelDepth: 8,
  premultiplyAlpha: false,
  progressive: false,
  progressiveQuality: 25,
  scalingMode: 1, // 1/2
  blur: 0,
  previewProgressiveFrame: false,
  independentMainLayer: false,
  tiling: AVIFTiling.auto,
};

/**
 * Value passed as `denoiseLevel` when noise synthesis is enabled.
 *
 * libaom divides this by 10 to get its internal noise level, so 20 means 2.0.
 * On the still-image path (all-intra) libaom ignores the value entirely and
 * substitutes its own measurement of the source, clamped to 5.0 - so there any
 * non-zero value behaves identically. The number only bites on the progressive
 * path, which is not all-intra and so uses it literally as the denoise
 * strength; 2.0 sits mid-range of the values the all-intra estimator produces.
 */
export const NOISE_SYNTHESIS_DENOISE_LEVEL = 20;
