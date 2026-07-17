#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const include = (source, text, file) =>
  assert.ok(
    source.includes(text),
    `${file} must include ${JSON.stringify(text)}`,
  );
const exclude = (source, text, file) =>
  assert.ok(
    !source.includes(text),
    `${file} must exclude ${JSON.stringify(text)}`,
  );

const toCache = read('src/sw/to-cache.ts');
const sw = read('src/sw/index.ts');
const bridge = read('src/client/lazy-app/sw-bridge/index.ts');
const util = read('src/sw/util.ts');
const modelCache = read(
  'src/features/processors/ben2/shared/model-cache.ts',
);

include(
  toCache,
  "import * as pngDecoder from 'entry-data:codecs/png/pkg';",
  'to-cache',
);
include(
  toCache,
  "import { modelBytes as ben2ModelBytes } from 'features/processors/ben2/shared/meta';",
  'to-cache',
);
for (const role of [
  'features_worker',
  'model',
  'ort_asyncify_mjs',
  'ort_asyncify_wasm',
  'png_decoder_js',
  'png_decoder_wasm',
])
  include(toCache, `'${role}'`, 'to-cache');
include(
  toCache,
  'new Set(ben2AssetInventory.map((asset) => asset.path)).size !== 6',
  'to-cache',
);
include(
  toCache,
  "export const initial = ['/', '/manifest.json', ...initialJs];",
  'to-cache',
);
include(
  toCache,
  'return [...new Set(items)].filter((item) => !ben2Assets.includes(item));',
  'to-cache',
);

include(sw, 'ben2AssetInventory.filter(', 'service worker');
include(sw, "({ role }) => role === 'model',", 'service worker');
include(sw, 'ben2ModelCacheName', 'service worker');
include(sw, 'isBen2ModelDownloadRequest(event.request)', 'service worker');
include(sw, 'matchValidatedBen2Model()', 'service worker');
include(sw, "headers.delete('X-Squoosh-BEN2-Download')", 'service worker');
include(sw, 'cacheBen2Asset(event, versionedCache)', 'service worker');
exclude(sw, 'ben2-cache-status', 'service worker');
exclude(sw, 'ben2-download-model', 'service worker');
exclude(sw, 'heartbeat', 'service worker');
exclude(sw, 'downloadBen2Model(', 'service worker');

for (const obsolete of [
  'Ben2CacheStatus',
  'ben2CacheStatus',
  'ben2ModelIsCached',
  'downloadBen2Model',
  'ben2-cache-status',
  'ben2-download-model',
  'MessageChannel',
])
  exclude(bridge, obsolete, 'SW bridge');

for (const requirement of [
  'isCanonicalBen2AssetRequest(request)',
  'isAdmissibleBen2AssetResponse(response)',
  'responseToCache = response.clone()',
  'cache.put(request, responseToCache)',
  'event.waitUntil(cacheWrite.catch(() => undefined))',
  'const cacheNames = await caches.keys()',
])
  include(util, requirement, 'five-role BEN2 lazy cache policy');
for (const obsolete of [
  'X-Squoosh-BEN2-Validated',
  'matchValidatedBen2Model',
  'downloadBen2Model',
  'staging',
])
  exclude(util, obsolete, 'SW util');

include(
  modelCache,
  "export const ben2ModelCacheName = 'squoosh-ben2-model-v1';",
  'model cache',
);
include(modelCache, 'readCachedBen2ModelBytes()', 'model cache');
include(modelCache, 'fetch(explicitDownloadRequest())', 'model cache');
exclude(modelCache, 'serviceWorker', 'model cache');

console.log('PASS six-role BEN2 inventory and dedicated-cache source contract');
