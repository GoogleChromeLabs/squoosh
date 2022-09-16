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
import * as iconLargeMaskable from 'img-url:static-build/assets/icon-large-maskable.png';
import * as iconLarge from 'img-url:static-build/assets/icon-large.png';
import * as screenshot1 from 'img-url:static-build/assets/screenshot1.png';
import * as screenshot2 from 'img-url:static-build/assets/screenshot2.jpg';
import * as screenshot3 from 'img-url:static-build/assets/screenshot3.jpg';
import * as screenshot4 from 'img-url:static-build/assets/screenshot4.png';
import * as screenshot5 from 'img-url:static-build/assets/screenshot5.jpg';
import * as screenshot6 from 'img-url:static-build/assets/screenshot6.jpg';
import dedent from 'dedent';
import { lookup as lookupMime } from 'mime-types';

interface Dimensions {
  width: number;
  height: number;
}

const manifestSize = ({ width, height }: Dimensions) => `${width}x${height}`;
const formFactor = ({ width, height }: Dimensions) =>
  width > height ? 'wide' : 'narrow';

const screenshots = [
  screenshot1,
  screenshot2,
  screenshot3,
  screenshot4,
  screenshot5,
  screenshot6,
].map((screenshot) => ({
  src: screenshot.default,
  type: lookupMime(screenshot.default),
  sizes: manifestSize(screenshot),
  form_factor: formFactor(screenshot),
}));

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
        src: iconLarge.default,
        type: lookupMime(iconLarge.default),
        sizes: manifestSize(iconLarge),
      },
      {
        src: iconLargeMaskable.default,
        type: lookupMime(iconLargeMaskable.default),
        sizes: manifestSize(iconLargeMaskable),
        purpose: 'maskable',
      },
    ],
    description:
      'Compress and compare images with different codecs, right in your browser.',
    lang: 'en',
    categories: ['photo', 'productivity', 'utilities'],
    screenshots,
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

    # I don't think Rollup is cache-busting files correctly.
    #/c/*
    #  Cache-Control: max-age=31536000

    # COOP+COEP for WebAssembly threads.
    /*
      Cross-Origin-Embedder-Policy: require-corp
      Cross-Origin-Opener-Policy: same-origin
  `,
};

writeFiles(toOutput);
