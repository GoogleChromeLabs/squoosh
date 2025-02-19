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
import { promisify } from 'util';
import { promises as fsp, readFileSync } from 'fs';
import path from 'path';
import { posix } from 'path';
import glob from 'glob';
import postcss from 'postcss';
import postCSSNested from 'postcss-nested';
import postCSSUrl from 'postcss-url';
import postCSSModules from 'postcss-modules';
import postCSSSimpleVars from 'postcss-simple-vars';
import cssNano from 'cssnano';
import {
  parse as parsePath,
  resolve as resolvePath,
  dirname,
  normalize as nomalizePath,
  sep as pathSep,
} from 'path';

const globP = promisify(glob);

const moduleId = 'initial-css:';
const initialCssModule = '\0initialCss';

export default function initialCssPlugin() {
  return {
    name: 'initial-css-plugin',
    resolveId(id) {
      if (id === moduleId) return initialCssModule;
    },
    async load(id) {
      if (id !== initialCssModule) return;

      const matches = (
        await globP('shared/prerendered-app/**/*.css', {
          nodir: true,
          cwd: path.join(process.cwd(), 'src'),
          absolute: true,
        })
      ).map((cssPath) =>
        // glob() returns windows paths with a forward slash. Normalise it:
        path.normalize(cssPath),
      );

      // Sort the matches so the parentmost items appear first.
      // This is a bit of a hack, but it means the util stuff appears in the cascade first.
      const sortedMatches = matches
        .map((match) => path.normalize(match).split(path.sep))
        .sort((a, b) => a.length - b.length)
        .map((match) => '/' + posix.join(...match));

      const cssSources = await Promise.all(
        sortedMatches.map(async (path) => {
          this.addWatchFile(path);
          const file = await fsp.readFile(path);

          const cssResult = await postcss([
            postCSSNested,
            postCSSSimpleVars(),
            postCSSModules({
              root: '',
            }),
            postCSSUrl({
              url: ({ relativePath, url }) => {
                if (/^((https?|data):|#)/.test(url)) return url;
                const parsedPath = parsePath(relativePath);
                const source = readFileSync(
                  resolvePath(dirname(path), relativePath),
                );
                const fileId = this.emitFile({
                  type: 'asset',
                  name: parsedPath.base,
                  source,
                });
                const hash = createHash('md5');
                hash.update(source);
                const md5 = hash.digest('hex');
                hashToId.set(md5, fileId);
                return `/fake/path/to/asset/${md5}/`;
              },
            }),
            cssNano,
          ]).process(file, {
            from: path,
          });

          return cssResult.css;
        }),
      );

      const css = cssSources.join('\n');

      const fileId = this.emitFile({
        type: 'asset',
        source: css,
        name: 'initial.css',
      });

      return `export default import.meta.ROLLUP_FILE_URL_${fileId};`;
    },
  };
}
