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
import * as path from 'path';
import { promises as fs } from 'fs';
import glob from 'glob';
import { promisify } from 'util';

const globP = promisify(glob);

export default function emitFiles({ root, include }) {
  return {
    name: 'emit-files-plugin',
    async buildStart() {
      const paths = await globP(include, { nodir: true, cwd: root });

      await Promise.all(
        paths.map(async (filePath) => {
          return this.emitFile({
            type: 'asset',
            source: await fs.readFile(path.join(root, filePath)),
            fileName: 'static/' + filePath,
          });
        }),
      );
    },
  };
}
