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

/**
 * The source rect to take when fitting an sw x sh image into dw x dh without
 * distorting it. `centeringX`/`centeringY` choose which part survives the crop:
 * 0 keeps the left/top edge, 0.5 the middle, 1 the right/bottom edge.
 */
export function getContainOffsets(
  sw: number,
  sh: number,
  dw: number,
  dh: number,
  centeringX = 0.5,
  centeringY = 0.5,
) {
  const currentAspect = sw / sh;
  const endAspect = dw / dh;

  if (endAspect > currentAspect) {
    const newSh = sw / endAspect;
    return { sw, sh: newSh, sx: 0, sy: (sh - newSh) * centeringY };
  }

  const newSw = sh * endAspect;
  return { sh, sw: newSw, sx: (sw - newSw) * centeringX, sy: 0 };
}
