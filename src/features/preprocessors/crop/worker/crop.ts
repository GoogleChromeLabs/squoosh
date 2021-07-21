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
  { data, width, height }: ImageData,
  { top, right, bottom, left }: Options,
): Promise<ImageData> {
  const newWidth = width - left - right;
  const newHeight = height - top - bottom;

  const cols = width * 4;
  const newCols = newWidth * 4;

  const pixels = new Uint8ClampedArray(newHeight * newCols);
  for (let y = 0; y < newHeight; y++) {
    const x = left * 4;
    const row = new Uint8ClampedArray(
      data.buffer,
      (top + y) * cols + x,
      newCols,
    );
    pixels.set(row, y * newCols);
  }

  return new ImageData(pixels, newWidth, newHeight);
}
