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

export default async function flip(
  data: ImageData,
  opts: Options,
): Promise<ImageData> {
  const { vertical, horizontal } = opts;
  const source = data.data;
  const len = source.length;
  const pixels = new Uint8ClampedArray(len);
  const { width, height } = data;

  let i = 0;
  let x = 0;
  let y = 0;
  const cols = width * 4;
  while (i < len) {
    let from = vertical ? (height - y) * cols + x * 4 : i;
    if (horizontal) from = from - x * 4 + cols - x * 4; // todo: reduce

    pixels[i++] = source[from++];
    pixels[i++] = source[from++];
    pixels[i++] = source[from++];
    pixels[i++] = source[from];

    if (++x === width) {
      x = 0;
      y++;
    }
  }

  /*
  function swap(a: number, b: number) {
    let tmp = pixels[a];
    pixels[a] = pixels[b];
    pixels[b] = tmp;
  }
  function swapRgba(a: number, b: number) {
    swap(a, b);
    swap(a+1, b+1);
    swap(a+2, b+2);
    swap(a+3, b+3);
  }
  const COLS = data.width * 4;
  // for (let y = 0, y2 = (data.height - 1); y < y2; y+=4, y2-=4) {
  for (let y = 0; y < data.height; y++) {
    for (let x = 0, x2 = COLS - 4; x < x2; x+=4, x2-=4) {
      const offsetX = y * COLS;
      const offsetY = (opts.vertical ? (data.height - y) : y) * COLS;
      const flippedX = opts.horizontal ? x2 : x;
      swapRgba(offsetX + x, offsetY + x2);
    }
  }
  */
  return new ImageData(pixels, data.width, data.height);
}
