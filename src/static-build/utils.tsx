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
import { promises as fsp } from 'fs';
import { join as joinPath } from 'path';

import render from 'preact-render-to-string';
import { VNode } from 'preact';

export function renderPage(vnode: VNode) {
  return '<!DOCTYPE html>' + render(vnode);
}

interface OutputMap {
  [path: string]: string;
}

export function writeFiles(toOutput: OutputMap) {
  Promise.all(
    Object.entries(toOutput).map(async ([path, content]) => {
      const pathParts = ['.tmp', 'build', 'static', ...path.split('/')];
      await fsp.mkdir(joinPath(...pathParts.slice(0, -1)), { recursive: true });
      const fullPath = joinPath(...pathParts);
      try {
        await fsp.writeFile(fullPath, content, {
          encoding: 'utf8',
        });
      } catch (err) {
        console.error('Failed to write ' + fullPath);
        throw err;
      }
    }),
  ).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

/**
 * Escape a string for insertion in a style or script tag
 */
export function escapeStyleScriptContent(str: string): string {
  return str
    .replace(/<!--/g, '<\\!--')
    .replace(/<script/g, '<\\script')
    .replace(/<\/script/g, '<\\/script')
    .replace(/<style/g, '<\\style')
    .replace(/<\/style/g, '<\\/style');
}

/**
 * Removes empty lines from start and end, and removes the initial indent from
 * each line.
 */
export function normalizeIndent(str: string): string {
  // trim empty lines from start & end
  str = str.replace(/^\s?\n|\n\s?$/g, '');

  const lines = str.split('\n');
  const indentLen = /^\s*/.exec(lines[0])![0].length;
  return lines.map((l) => l.slice(indentLen)).join('\n');
}
