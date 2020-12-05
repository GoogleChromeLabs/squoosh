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

import path from 'path';
import { posix } from 'path';
import glob from 'glob';

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

      const matches = await globP('shared/prerendered-app/**/*.css', {
        nodir: true,
        cwd: path.join(process.cwd(), 'src'),
      });

      // Sort the matches so the parentmost items appear first.
      // This is a bit of a hack, but it means the util stuff appears in the cascade first.
      const sortedMatches = matches
        .map((match) => path.normalize(match).split(path.sep))
        .sort((a, b) => a.length - b.length)
        .map((match) => posix.join(...match));

      const imports = sortedMatches
        .map((id, i) => `import css${i} from 'css:${id}';\n`)
        .join('');

      return (
        imports +
        `export default ${sortedMatches.map((_, i) => `css${i}`).join(' + ')};`
      );
    },
  };
}
