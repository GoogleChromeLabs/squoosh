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
import { promises as fs } from 'fs';

import { lookup as lookupMime } from 'mime-types';

const prefix = /^data-url(-text)?:/;

export default function dataURLPlugin() {
  return {
    name: 'data-url-plugin',
    async resolveId(id, importer) {
      const match = prefix.exec(id);
      if (!match) return;
      return (
        match[0] + (await this.resolve(id.slice(match[0].length), importer)).id
      );
    },
    async load(id) {
      const match = prefix.exec(id);
      if (!match) return;

      const isText = !!match[1];
      const realId = id.slice(match[0].length);
      this.addWatchFile(realId);

      const source = await fs.readFile(realId);
      const type = lookupMime(realId) || 'text/plain';

      if (isText) {
        const encodedBody = encodeURIComponent(source.toString('utf8'));

        return `export default ${JSON.stringify(
          `data:${type};charset=utf-8,${encodedBody}`,
        )};`;
      }

      return `export default ${JSON.stringify(
        `data:${type};base64,${source.toString('base64')}`,
      )};`;
    },
  };
}
