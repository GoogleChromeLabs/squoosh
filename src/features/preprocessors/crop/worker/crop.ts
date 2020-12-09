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
import { Options } from '../shared/meta';

export default async function crop(
  data: ImageData,
  opts: Options,
): Promise<ImageData> {
  const { left, top, right, bottom } = opts;
  const source = data.data;
  const { width, height } = data;
  const cols = width * 4;

  const newWidth = width - left - right;
  const newHeight = height - top - bottom;
  const len = newWidth * newHeight * 4;
  const pixels = new Uint8ClampedArray(len);

  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      let i = y * cols + x * 4;
      let j = (top + y) * cols + (left + x) * 4;
      pixels[i] = source[j];
      pixels[i + 1] = source[j + 1];
      pixels[i + 2] = source[j + 2];
      pixels[i + 3] = source[j + 3];
    }
  }

  // let sourceX = left;
  // let sourceY = top;
  // let x = 0;
  // let y = 0;
  // let i = 0;
  // while (i < len) {
  //   let from = sourceY * cols + sourceX * 4;

  //   pixels[i++] = source[from++];
  //   pixels[i++] = source[from++];
  //   pixels[i++] = source[from++];
  //   pixels[i++] = source[from];

  //   if (++x === newWidth) {
  //     x = 0;
  //     y++;

  //     sourceX = left;
  //     sourceY++;
  //   }
  // }

  return new ImageData(pixels, newWidth, newHeight);
}
