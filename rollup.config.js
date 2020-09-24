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
import { promises as fsp } from 'fs';
import del from 'del';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import OMT from '@surma/rollup-plugin-off-main-thread';
import replace from '@rollup/plugin-replace';

import simpleTS from './lib/simple-ts';
import clientBundlePlugin from './lib/client-bundle-plugin';
import nodeExternalPlugin from './lib/node-external-plugin';
import cssPlugin from './lib/css-plugin';
import urlPlugin from './lib/url-plugin';
import resolveDirsPlugin from './lib/resolve-dirs-plugin';
import runScript from './lib/run-script';
import emitFiles from './lib/emit-files-plugin';
import imageWorkerPlugin from './lib/image-worker-plugin';
import initialCssPlugin from './lib/initial-css-plugin';

function resolveFileUrl({ fileName }) {
  return JSON.stringify(fileName.replace(/^static\//, '/'));
}

// With AMD output, Rollup always uses document.baseURI, which breaks in workers.
// This fixes it:
function resolveImportMeta(property, { chunkId }) {
  if (property !== 'url') return;
  return `new URL(${resolveFileUrl({ fileName: chunkId })}, location).href`;
}

export default async function ({ watch }) {
  const omtLoaderPromise = fsp.readFile(
    path.join(__dirname, 'lib', 'omt.ejs'),
    'utf-8',
  );
  await del('.tmp/build');

  const isProduction = !watch;

  const tsPluginInstance = simpleTS('.', {
    watch,
  });
  const commonPlugins = () => [
    tsPluginInstance,
    resolveDirsPlugin([
      'src/static-build',
      'src/client',
      'src/shared',
      'src/features',
      'codecs',
    ]),
    urlPlugin(),
    cssPlugin(resolveFileUrl),
  ];
  const dir = '.tmp/build';
  const staticPath = 'static/c/[name]-[hash][extname]';

  return {
    input: 'src/static-build/index.tsx',
    output: {
      dir,
      format: 'cjs',
      assetFileNames: staticPath,
      exports: 'named',
    },
    // Don't watch the ts files. Instead we watch the output from the ts compiler.
    watch: { clearScreen: false, exclude: ['**/*.ts', '**/*.tsx'] },
    preserveModules: true,
    plugins: [
      { resolveFileUrl, resolveImportMeta },
      clientBundlePlugin(
        {
          plugins: [
            { resolveFileUrl, resolveImportMeta },
            OMT({ loader: await omtLoaderPromise }),
            ...commonPlugins(),
            commonjs(),
            resolve(),
            replace({ __PRERENDER__: false, __PRODUCTION__: isProduction }),
            //terser({ module: true }),
          ],
        },
        {
          dir,
          format: 'amd',
          chunkFileNames: staticPath.replace('[extname]', '.js'),
          entryFileNames: staticPath.replace('[extname]', '.js'),
        },
        resolveFileUrl,
      ),
      ...commonPlugins(),
      emitFiles({ include: '**/*', root: path.join(__dirname, 'src', 'copy') }),
      nodeExternalPlugin(),
      imageWorkerPlugin(),
      replace({ __PRERENDER__: true, __PRODUCTION__: isProduction }),
      initialCssPlugin(),
      runScript(dir + '/static-build/index.js'),
    ],
  };
}
