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
import type { EncodeOptions } from '../shared/meta';

import { getEncoderModule } from '../shared/encoderModule';

/**
 * Losslessly recompress a JPEG as JPEG XL.
 *
 * `data` is the original JPEG file, not pixels: libjxl re-entropy-codes its DCT
 * coefficients rather than decoding and re-encoding the image. `width` and
 * `height` are passed on only to size the thread pool.
 */
export default async function transcode(
  data: ArrayBuffer,
  width: number,
  height: number,
  options: EncodeOptions,
): Promise<ArrayBuffer> {
  const module = await getEncoderModule();

  // Only the options that mean something for a transcode are passed on. The
  // rest (quality, modular, photon noise, progressive DC, ...) describe
  // decisions libjxl doesn't get to make here.
  const result = module.transcode(data, width, height, {
    effort: options.effort,
    storeJpegMetadata: options.storeJpegMetadata,
    keepMetadata: options.keepMetadata,
    progressiveAC: options.progressiveAC,
    groupOrder: options.groupOrder,
    decodingSpeed: options.decodingSpeed,
  });

  if (!result) throw new Error('Transcoding error.');

  return result.buffer;
}
