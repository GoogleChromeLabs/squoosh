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
import { builtinModules } from 'module';

const builtins = new Set(builtinModules);

// Check that a node module exists, but treat it as external.
export default function () {
  return {
    name: 'node-external',
    resolveId(id, importer) {
      // Entry points and relative/absolute paths are never node modules.
      if (!importer || /^[./\\]|^[a-z]:/i.test(id)) return;
      if (id.startsWith('node:') || builtins.has(id)) {
        return { id, external: true };
      }
      try {
        // Bare ids like 'client/...' may resolve to local source on some
        // runtimes, so only treat things in node_modules as external.
        if (!/[\\/]node_modules[\\/]/.test(import.meta.resolve(id))) return;
        return { id, external: true };
      } catch (err) {}
    },
  };
}
