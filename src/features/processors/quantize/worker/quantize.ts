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

function alphaQuantize(
  module: QuantizerModule,
  data: ImageData,
  opts: Options,
): Uint8ClampedArray {
  const alphaData = new Uint8ClampedArray(data.data.length);

  for (let i = 0; i < data.data.length; i += 4) {
    alphaData[i] = alphaData[i + 1] = alphaData[i + 2] = data.data[i + 3];
    alphaData[i + 3] = 255;
  }

  const result = module.quantize(
    alphaData,
    data.width,
    data.height,
    opts.maxNumColors,
    opts.dither,
  );

  for (let i = 0; i < result.length; i += 4) {
    const alpha = result[i];
    result[i] = data.data[i];
    result[i + 1] = data.data[i + 1];
    result[i + 2] = data.data[i + 2];
    result[i + 3] = alpha;
  }

  return result;
}

export default async function process(
  data: ImageData,
  opts: Options,
): Promise<ImageData> {
  if (!emscriptenModule) {
    emscriptenModule = initEmscriptenModule(imagequant);
  }

  const module = await emscriptenModule;

  const result = opts.zx
    ? module.zx_quantize(data.data, data.width, data.height, opts.dither)
    : opts.alphaOnly
    ? alphaQuantize(module, data, opts)
    : module.quantize(
        data.data,
        data.width,
        data.height,
        opts.maxNumColors,
        opts.dither,
      );

  return new ImageData(result, data.width, data.height);
}
