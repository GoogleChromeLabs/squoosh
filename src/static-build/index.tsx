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
import { h } from 'preact';

import { renderPage, writeFiles } from './utils';
import IndexPage from './pages/index';
import iconLargeMaskable from 'url:static-build/assets/icon-large-maskable.png';
import iconLarge from 'url:static-build/assets/icon-large.png';
import screenshot1 from 'url:static-build/assets/screenshot1.png';
import screenshot2 from 'url:static-build/assets/screenshot2.jpg';
import screenshot3 from 'url:static-build/assets/screenshot3.jpg';
import dedent from 'dedent';
import mime from 'mime-types';

// Set by Netlify
const branch = process.env.BRANCH;

const branchOriginTrialIds = new Map([
  [
    'dev',
    'As3b1fXjclhF8ZgvUkIqOo3r1/Jqvx0mNuT6Ilgb7SdpeJnV8lUdYr7i+OKgCmcVTWkqjkF23LJ+xZ111VYMEQIAAABheyJvcmlnaW4iOiJodHRwczovL2Rldi0tc3F1b29zaC5uZXRsaWZ5LmFwcDo0NDMiLCJmZWF0dXJlIjoiV2ViQXNzZW1ibHlTaW1kIiwiZXhwaXJ5IjoxNjA5NDI4Nzk4fQ==',
  ],
  [
    'live',
    'Ak9YMaDZyWUUZFbVJng8FM2LWWNeBcWaHTtHzzaTAq044kMlQH5/hsMb/90Ii2I7m/lPx8EpgOIUMWkWeoaKfgIAAABUeyJvcmlnaW4iOiJodHRwczovL3NxdW9vc2guYXBwOjQ0MyIsImZlYXR1cmUiOiJXZWJBc3NlbWJseVNpbWQiLCJleHBpcnkiOjE2MTExNTkwNjZ9',
  ],
]);

const originTrialId = branchOriginTrialIds.get(branch || '');

interface Output {
  [outputPath: string]: string;
}
const toOutput: Output = {
  'index.html': renderPage(<IndexPage />),
  'manifest.json': JSON.stringify({
    name: 'Squoosh',
    short_name: 'Squoosh',
    start_url: '/?utm_medium=PWA&utm_source=launcher',
    display: 'standalone',
    orientation: 'any',
    background_color: '#fff',
    theme_color: '#ff3385',
    icons: [
      {
        src: iconLarge,
        type: mime.lookup(iconLarge),
        sizes: '1024x1024',
      },
      {
        src: iconLargeMaskable,
        type: mime.lookup(iconLargeMaskable),
        sizes: '1024x1024',
        purpose: 'maskable',
      },
    ],
    description:
      'Compress and compare images with different codecs, right in your browser.',
    lang: 'en',
    categories: ['photo', 'productivity', 'utilities'],
    screenshots: [
      {
        src: screenshot1,
        type: mime.lookup(screenshot1),
        sizes: '540x720',
      },
      {
        src: screenshot2,
        type: mime.lookup(screenshot2),
        sizes: '540x720',
      },
      {
        src: screenshot3,
        type: mime.lookup(screenshot3),
        sizes: '540x720',
      },
    ],
    share_target: {
      action: '/?utm_medium=PWA&utm_source=share-target&share-target',
      method: 'POST',
      enctype: 'multipart/form-data',
      params: {
        files: [
          {
            name: 'file',
            accept: ['image/*'],
          },
        ],
      },
    },
  }),
  _headers: dedent`
    /*
      Cache-Control: no-cache

    /c/*
      Cache-Control: max-age=31536000

    # COOP+COEP for WebAssembly threads.
    /*
      Cross-Origin-Embedder-Policy: require-corp
      Cross-Origin-Opener-Policy: same-origin

    # Origin trial for WebAssembly SIMD.
    ${
      originTrialId
        ? `  Origin-Trial: ${originTrialId}`
        : `# Cannot find origin trial ID. process.env.BRANCH is: ${JSON.stringify(
            branch,
          )}`
    }
  `,
};

writeFiles(toOutput);
