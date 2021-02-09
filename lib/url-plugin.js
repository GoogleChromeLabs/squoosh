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
import { basename } from 'path';
import { imageSize } from 'image-size';

const defaultOpts = {
  prefix: 'url',
  imagePrefix: 'img-url',
};

export default function urlPlugin(opts) {
  opts = Object.assign({}, defaultOpts, opts);

  /** @type {Map<string, Buffer>} */
  let assetIdToSourceBuffer;

  const prefix = opts.prefix + ':';
  const imagePrefix = opts.imagePrefix + ':';
  return {
    name: 'url-plugin',
    buildStart() {
      assetIdToSourceBuffer = new Map();
    },
    augmentChunkHash(info) {
      // Get the sources for all assets imported by this chunk.
      const buffers = Object.keys(info.modules)
        .map((moduleId) => assetIdToSourceBuffer.get(moduleId))
        .filter(Boolean);

      if (buffers.length === 0) return;

      for (const moduleId of Object.keys(info.modules)) {
        const buffer = assetIdToSourceBuffer.get(moduleId);
        if (buffer) buffers.push(buffer);
      }

      const combinedBuffer =
        buffers.length === 1 ? buffers[0] : Buffer.concat(buffers);

      return combinedBuffer;
    },
    async resolveId(id, importer) {
      const idPrefix = [prefix, imagePrefix].find((prefix) =>
        id.startsWith(prefix),
      );
      if (!idPrefix) return;

      const realId = id.slice(idPrefix.length);
      const resolveResult = await this.resolve(realId, importer);

      if (!resolveResult) {
        throw Error(`Cannot find ${realId}`);
      }
      // Add an additional .js to the end so it ends up with .js at the end in the _virtual folder.
      return idPrefix + resolveResult.id + '.js';
    },
    async load(id) {
      const idPrefix = [prefix, imagePrefix].find((prefix) =>
        id.startsWith(prefix),
      );
      if (!idPrefix) return;

      const realId = id.slice(idPrefix.length, -'.js'.length);
      const source = await fs.readFile(realId);
      assetIdToSourceBuffer.set(id, source);
      this.addWatchFile(realId);

      let imgSizeExport = '';

      if (idPrefix === imagePrefix) {
        const imgInfo = imageSize(source);
        imgSizeExport = [
          `export const width = ${JSON.stringify(imgInfo.width)};`,
          `export const height = ${JSON.stringify(imgInfo.height)};`,
        ].join('\n');
      }

      return [
        `export default import.meta.ROLLUP_FILE_URL_${this.emitFile({
          type: 'asset',
          source,
          name: basename(realId),
        })};`,
        imgSizeExport,
      ].join('\n');
    },
  };
}
