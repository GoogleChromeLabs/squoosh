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
import imagequant, { QuantizerModule } from 'codecs/imagequant/imagequant';
import { initEmscriptenModule } from 'features/worker-utils';
import { Options } from '../shared/meta';

let emscriptenModule: Promise<QuantizerModule>;

export default async function process(
  data: ImageData,
  opts: Options,
): Promise<ImageData> {
  if (!emscriptenModule) {
    emscriptenModule = initEmscriptenModule(imagequant);
  }

  const module = await emscriptenModule;
  let alpha_data: Uint8ClampedArray;

  if (opts.alphaOnly) {
    alpha_data = getAlphaData(data.data);
  }

  const result = opts.zx
    ? module.zx_quantize(
        opts.alphaOnly ? alpha_data! : data.data,
        data.width,
        data.height,
        opts.dither,
      )
    : module.quantize(
        opts.alphaOnly ? alpha_data! : data.data,
        data.width,
        data.height,
        opts.maxNumColors,
        opts.dither,
      );

  //Apply the result back to the original image if only alpha is checked
  if (opts.alphaOnly) {
    for (let i = 0; i < result.length; i += 4) {
      const alpha = alpha_data![i + 3];
      data.data[i + 3] = alpha;
    }
  }

  return new ImageData(
    opts.alphaOnly ? data.data : result,
    data.width,
    data.height,
  );
}

/**
 * Return a single color version of the image with alpha channel preserved
 * @param data The original image data
 * @returns A single color image with alpha channel preseved
 */
function getAlphaData(data: Uint8ClampedArray): Uint8ClampedArray {
  let copy = new Uint8ClampedArray(data);
  for (let i = 0; i < copy.length; i += 4) {
    copy[i] = 0;
    copy[i + 1] = 0;
    copy[i + 2] = 0;
  }

  return copy;
}
