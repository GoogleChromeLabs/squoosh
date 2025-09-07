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
import { posix, isAbsolute, resolve } from 'path';

export default function resolveDirs(paths) {
  const pathBaseDir = paths.map((path) => [
    posix.basename(path),
    posix.dirname(path),
  ]);

  return {
    name: 'resolve-dirs',
    async resolveId(id) {
      const match = pathBaseDir.find(
        ([pathId]) => id === pathId || id.startsWith(pathId + '/'),
      );
      if (!match) return;
      const pathDir = match[1];
      const resolveResult = await this.resolve(`./${pathDir}/${id}`, './');
      if (!resolveResult) {
        throw new Error(`Couldn't find ${'./' + id}`);
      }
      if (isAbsolute(resolveResult.id)) return resolveResult.id;
      return resolve(resolveResult.id);
    },
  };
}
