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
import dedent from 'dedent';

// Set by Netlify
const branch = process.env.BRANCH;

const branchOriginTrialIds = new Map([
  [
    'dev',
    'As3b1fXjclhF8ZgvUkIqOo3r1/Jqvx0mNuT6Ilgb7SdpeJnV8lUdYr7i+OKgCmcVTWkqjkF23LJ+xZ111VYMEQIAAABheyJvcmlnaW4iOiJodHRwczovL2Rldi0tc3F1b29zaC5uZXRsaWZ5LmFwcDo0NDMiLCJmZWF0dXJlIjoiV2ViQXNzZW1ibHlTaW1kIiwiZXhwaXJ5IjoxNjA5NDI4Nzk4fQ==',
  ],
  [
    'live',
    'AgoKiDqjr0GVPtrwV/vuVlrrSvbDa5Yb99s+q66ly816DrrAQ8Cdas33NgDtmhxM4BtDP9PEdyuxHPyTQHD5ZAcAAABUeyJvcmlnaW4iOiJodHRwczovL3NxdW9vc2guYXBwOjQ0MyIsImZlYXR1cmUiOiJXZWJBc3NlbWJseVNpbWQiLCJleHBpcnkiOjE2MDg2NzI5OTR9',
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
    theme_color: '#f78f21',
    icons: [
      {
        src: iconLarge,
        type: 'image/png',
        sizes: '1024x1024',
      },
      {
        src: iconLargeMaskable,
        type: 'image/png',
        sizes: '1024x1024',
        purpose: 'maskable',
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
