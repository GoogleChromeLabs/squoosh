import resolve from '@rollup/plugin-node-resolve';
import cjs from '@rollup/plugin-commonjs';
import simpleTS from './lib/simple-ts';
import asset from './lib/asset-plugin.js';
import json from './lib/json-plugin.js';
import autojson from './lib/autojson-plugin.js';
import { getBabelOutputPlugin } from '@rollup/plugin-babel';
import { builtinModules } from 'module';

/** @type {import('rollup').RollupOptions} */
export default {
  input: 'src/index.js',
  output: {
    dir: 'build',
    format: 'cjs',
    assetFileNames: '[name]-[hash][extname]',
  },
  plugins: [
    resolve(),
    cjs(),
    asset(),
    autojson(),
    json(),
    simpleTS('.'),
    getBabelOutputPlugin({
      babelrc: false,
      configFile: false,
      minified: process.env.DEBUG != '',
      comments: true,
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 12,
            },
            loose: true,
          },
        ],
      ],
    }),
  ],
  external: [...builtinModules, 'web-streams-polyfill'],
};
