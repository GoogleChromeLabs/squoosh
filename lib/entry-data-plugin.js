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
import { getDependencies } from './client-bundle-plugin';
import * as path from 'path';

const prefix = 'entry-data:';
const mainNamePlaceholder = 'ENTRY_DATA_PLUGIN_MAIN_NAME';
const dependenciesPlaceholder = 'ENTRY_DATA_PLUGIN_DEPS';
const placeholderRe = /(ENTRY_DATA_PLUGIN_(?:MAIN_NAME|DEPS))(\d+)/g;

/** @param {string} fileName */
export function fileNameToURL(fileName) {
  return fileName.replace(/^static\//, '/');
}

export default function entryDataPlugin() {
  /** @type {number} */
  let exportCounter;
  /** @type {Map<number, string>} */
  let counterToIdMap;

  return {
    name: 'entry-data-plugin',
    buildStart() {
      exportCounter = 0;
      counterToIdMap = new Map();
    },
    async resolveId(id, importer) {
      if (!id.startsWith(prefix)) return;
      const realId = id.slice(prefix.length);
      const resolveResult = await this.resolve(realId, importer);

      if (!resolveResult) throw Error(`Cannot find ${realId}`);
      // Add an additional .js to the end so it ends up with .js at the end in the _virtual folder.
      return prefix + resolveResult.id + '.js';
    },
    load(id) {
      if (!id.startsWith(prefix)) return;
      const realId = id.slice(prefix.length, -'.js'.length);
      exportCounter++;

      counterToIdMap.set(exportCounter, path.normalize(realId));

      return [
        `export const main = ${mainNamePlaceholder + exportCounter};`,
        `export const deps = ${dependenciesPlaceholder + exportCounter};`,
      ].join('\n');
    },
    generateBundle(_, bundle) {
      const chunks = Object.values(bundle).filter(
        (item) => item.type === 'chunk',
      );
      for (const chunk of chunks) {
        chunk.code = chunk.code.replace(
          placeholderRe,
          (_, placeholder, numStr) => {
            const id = counterToIdMap.get(Number(numStr));
            const chunk = chunks.find(
              (chunk) =>
                chunk.facadeModuleId &&
                path.normalize(chunk.facadeModuleId) === id,
            );
            if (!chunk) throw Error(`Cannot find ${id}`);

            if (placeholder === mainNamePlaceholder) {
              return JSON.stringify(fileNameToURL(chunk.fileName));
            }

            return JSON.stringify(
              getDependencies(chunks, chunk).map((filename) =>
                fileNameToURL(filename),
              ),
            );
          },
        );
      }
    },
  };
}
