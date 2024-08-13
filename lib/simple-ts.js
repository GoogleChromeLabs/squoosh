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
import { spawn } from 'child_process';
import { relative, join } from 'path';
import { promises as fsp } from 'fs';
import { promisify } from 'util';

import * as ts from 'typescript';
import glob from 'glob';
import { sync as whichSync } from 'which';

const globP = promisify(glob);

const tscPath = whichSync('tsc');

const extRe = /\.tsx?$/;

function loadConfig(mainPath) {
  const fileName = ts.findConfigFile(mainPath, ts.sys.fileExists);
  if (!fileName) throw Error('tsconfig not found');
  const text = ts.sys.readFile(fileName);
  const loadedConfig = ts.parseConfigFileTextToJson(fileName, text).config;
  const parsedTsConfig = ts.parseJsonConfigFileContent(
    loadedConfig,
    ts.sys,
    process.cwd(),
    undefined,
    fileName,
  );
  return parsedTsConfig;
}

export default function simpleTS(mainPath, { noBuild, watch } = {}) {
  const config = loadConfig(mainPath);
  const args = ['-b', mainPath];

  let tsBuildDone;

  async function watchBuiltFiles(rollupContext) {
    const matches = await globP(config.options.outDir + '/**/*.js');
    for (const match of matches) rollupContext.addWatchFile(match);
  }

  async function tsBuild(rollupContext) {
    if (tsBuildDone) {
      // Watch lists are cleared on each build, so we need to rewatch all the JS files.
      await watchBuiltFiles(rollupContext);
      return tsBuildDone;
    }
    if (noBuild) {
      return (tsBuildDone = Promise.resolve());
    }
    tsBuildDone = Promise.resolve().then(async () => {
      await new Promise((resolve) => {
        const proc = spawn(tscPath, args, {
          stdio: 'inherit',
          shell: true,
        });

        proc.on('exit', (code) => {
          if (code !== 0) {
            throw Error('TypeScript build failed');
          }
          resolve();
        });
      });

      await watchBuiltFiles(rollupContext);

      if (watch) {
        tsBuildDone.then(() => {
          spawn(tscPath, [...args, '--watch', '--preserveWatchOutput'], {
            stdio: 'inherit',
          });
        });
      }
    });

    return tsBuildDone;
  }

  return {
    name: 'simple-ts',
    resolveId(id, importer) {
      // If there isn't an importer, it's an entry point, so we don't need to resolve it relative
      // to something.
      if (!importer) return null;

      const tsResolve = ts.resolveModuleName(
        id,
        importer,
        config.options,
        ts.sys,
      );

      if (
        // It didn't find anything
        !tsResolve.resolvedModule ||
        // Or if it's linking to a definition file, it's something in node_modules,
        // or something local like css.d.ts
        tsResolve.resolvedModule.extension === '.d.ts'
      ) {
        return null;
      }
      return tsResolve.resolvedModule.resolvedFileName;
    },
    async load(id) {
      if (!extRe.test(id)) return null;

      // TypeScript building is deferred until the first TS file load.
      // This allows prerequisites to happen first,
      // such as css.d.ts generation in css-plugin.
      await tsBuild(this);

      // Look for the JS equivalent in the tmp folder
      const newId = join(
        config.options.outDir,
        relative(process.cwd(), id),
      ).replace(extRe, '.js');

      return fsp.readFile(newId, { encoding: 'utf8' });
    },
  };
}
