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
import { createHash } from 'crypto';
import { posix } from 'path';

const importPrefix = 'service-worker:';

export default function serviceWorkerPlugin({
  output = 'sw.js',
  filterAssets = () => true,
} = {}) {
  return {
    name: 'service-worker',
    async resolveId(id, importer) {
      if (!id.startsWith(importPrefix)) return;

      const plainId = id.slice(importPrefix.length);
      const result = await this.resolve(plainId, importer);
      if (!result) return;

      return importPrefix + result.id;
    },
    load(id) {
      if (!id.startsWith(importPrefix)) return;
      const fileId = this.emitFile({
        type: 'chunk',
        id: id.slice(importPrefix.length),
        fileName: output,
      });

      return `export default import.meta.ROLLUP_FILE_URL_${fileId};`;
    },
    generateBundle(options, bundle) {
      const swChunk = bundle[output];
      const toCacheInSW = Object.values(bundle).filter(
        (item) => item !== swChunk && filterAssets(item),
      );
      const urls = toCacheInSW.map(
        (item) =>
          posix
            .relative(posix.dirname(output), item.fileName)
            .replace(/((?<=^|\/)index)?\.html?$/, '') || '.',
      );

      const versionHash = createHash('sha1');
      for (const item of toCacheInSW) {
        versionHash.update(item.code || item.source);
      }
      const version = versionHash.digest('hex');

      swChunk.code =
        `const ASSETS = ${JSON.stringify(urls, null, '  ')};\n` +
        `const VERSION = ${JSON.stringify(version)};\n` +
        swChunk.code;
    },
  };
}
