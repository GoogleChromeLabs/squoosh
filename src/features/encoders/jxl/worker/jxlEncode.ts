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

export default async function encode(
  data: ImageData,
  options: EncodeOptions,
): Promise<ArrayBuffer> {
  const module = await getEncoderModule();

  // `mode` covers what the codec calls `lossless`. The transcode-only options
  // don't exist on this side of the binding - see jxlTranscode.
  const { mode, storeJpegMetadata, keepMetadata, ...codecOptions } = options;

  const result = module.encode(data.data, data.width, data.height, {
    ...codecOptions,
    lossless: mode === 'lossless',
  });

  if (!result) throw new Error('Encoding error.');

  return result.buffer;
}
