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
import { h, FunctionalComponent } from 'preact';

import styles from 'css-bundle:./all.css';
import clientBundleURL, { imports } from 'client-bundle:client/initial-app';
import favicon from 'url:static-build/assets/favicon.ico';

interface Props {}

const Index: FunctionalComponent<Props> = () => (
  <html lang="en">
    <head>
      <title>Squoosh</title>
      <meta
        name="description"
        content="Compress and compare images with different codecs, right in your browser"
      />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
      />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <link rel="shortcut icon" href={favicon} />
      <meta name="theme-color" content="#f78f21" />
      <link rel="manifest" href="/manifest.json" />
      <link rel="stylesheet" href={styles} />
      <script src={clientBundleURL} defer />
      {imports.map((v) => (
        <link rel="preload" as="script" href={v} />
      ))}
    </head>
    <body>
      <div id="app" />
    </body>
  </html>
);

export default Index;
