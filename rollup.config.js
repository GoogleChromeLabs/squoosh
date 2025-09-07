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
import terser from '@rollup/plugin-terser';
import OMT from '@surma/rollup-plugin-off-main-thread';
import replace from '@rollup/plugin-replace';
import { importMetaAssets } from '@web/rollup-plugin-import-meta-assets';

import simpleTS from './lib/simple-ts';
import clientBundlePlugin from './lib/client-bundle-plugin';
import nodeExternalPlugin from './lib/node-external-plugin';
import cssPlugin from './lib/css-plugin';
import urlPlugin from './lib/url-plugin';
import resolveDirsPlugin from './lib/resolve-dirs-plugin';
import runScript from './lib/run-script';
import emitFiles from './lib/emit-files-plugin';
import featurePlugin from './lib/feature-plugin';
import initialCssPlugin from './lib/initial-css-plugin';
import serviceWorkerPlugin from './lib/sw-plugin';
import dataURLPlugin from './lib/data-url-plugin';
import entryDataPlugin, { fileNameToURL } from './lib/entry-data-plugin';
import dedent from 'dedent';

function resolveFileUrl({ fileName }) {
  return JSON.stringify(fileNameToURL(fileName));
}

function resolveImportMetaUrlInStaticBuild(property, { moduleId }) {
  if (property !== 'url') return;
  throw new Error(dedent`
    Attempted to use a \`new URL(..., import.meta.url)\` pattern in ${path.relative(
      process.cwd(),
      moduleId,
    )} for URL that needs to end up in static HTML.
    This is currently unsupported.
  `);
}

const dir = '.tmp/build';
const staticPath = 'static/c/[name]-[hash][extname]';
const jsPath = staticPath.replace('[extname]', '.js');

function jsFileName(chunkInfo) {
  if (!chunkInfo.facadeModuleId) return jsPath;
  const parsedPath = path.parse(chunkInfo.facadeModuleId);
  if (parsedPath.name !== 'index') return jsPath;
  // Come up with a better name than 'index'
  const name = parsedPath.dir.split(/\\|\//).slice(-1);
  return jsPath.replace('[name]', name);
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
      'src/features-worker',
      'src/features-worker-worker-bridge',
      'src/sw',
      'src/worker-shared',
      'codecs',
    ]),
    urlPlugin(),
    dataURLPlugin(),
    cssPlugin(),
  ];

  return {
    input: 'src/static-build/index.tsx',
    output: {
      dir,
      format: 'cjs',
      assetFileNames: staticPath,
      exports: 'named',
    },
    watch: {
      clearScreen: false,
      // Don't watch the ts files. Instead we watch the output from the ts compiler.
      exclude: ['**/*.ts', '**/*.tsx'],
      // Sometimes TypeScript does its thing a little slowly, which causes
      // Rollup to build twice on each change. This delay seems to fix it,
      // although we may need to change this number over time.
      buildDelay: 250,
    },
    preserveModules: true,
    plugins: [
      { resolveFileUrl, resolveImportMeta: resolveImportMetaUrlInStaticBuild },
      clientBundlePlugin(
        {
          external: ['worker_threads'],
          plugins: [
            { resolveFileUrl },
            OMT({ loader: await omtLoaderPromise }),
            importMetaAssets(),
            serviceWorkerPlugin({
              output: 'static/serviceworker.js',
            }),
            ...commonPlugins(),
            commonjs(),
            resolve(),
            replace({ __PRERENDER__: false, __PRODUCTION__: isProduction }),
            entryDataPlugin(),
            isProduction ? terser({ module: true }) : {},
          ],
          preserveEntrySignatures: false,
        },
        {
          dir,
          format: 'amd',
          chunkFileNames: jsFileName,
          entryFileNames: jsFileName,
          // This is needed because emscripten's workers use 'this', so they trigger all kinds of interop things,
          // such as double-wrapping objects in { default }.
          interop: false,
        },
        resolveFileUrl,
      ),
      ...commonPlugins(),
      emitFiles({ include: '**/*', root: path.join(__dirname, 'src', 'copy') }),
      nodeExternalPlugin(),
      featurePlugin(),
      replace({ __PRERENDER__: true, __PRODUCTION__: isProduction }),
      initialCssPlugin(),
      runScript(dir + '/static-build/index.js'),
    ],
  };
}
