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
import { h, FunctionalComponent, RenderableProps } from 'preact';
import styles from 'css-bundle:./all.css';
import clientBundleURL, { imports } from 'client-bundle:client/index.tsx';

interface Props {
  title?: string;
}

const BasePage: FunctionalComponent<Props> = ({
  children,
  title,
}: RenderableProps<Props>) => {
  return (
    <html lang="en">
      <head>
        <title>{title ? `${title} - ` : ''}Squoosh</title>
        <meta
          name="viewport"
          content="width=device-width, minimum-scale=1.0"
        ></meta>
        <link rel="stylesheet" href={styles} />
        <script src={clientBundleURL} defer />
        {imports.map((v) => (
          <link rel="preload" as="script" href={v} />
        ))}
      </head>
      <body>{children}</body>
    </html>
  );
};

export default BasePage;
