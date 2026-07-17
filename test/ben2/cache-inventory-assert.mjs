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

include(
  toCache,
  "import * as pngDecoder from 'entry-data:codecs/png/pkg';",
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
include(toCache, 'export const ben2ModelBytes = 219_121_675;', 'to-cache');
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

include(sw, 'ben2AssetInventory.map(async ({ role, path })', 'service worker');
include(sw, "event.data?.action === 'ben2-cache-status'", 'service worker');
include(sw, "event.data?.action === 'ben2-download-model'", 'service worker');
include(sw, 'ben2AssetInventory.filter(', 'service worker');
include(sw, "({ role }) => role === 'model',", 'service worker');
include(sw, 'serveBen2ModelFromCache(', 'service worker');
include(sw, 'ben2ModelBytes,', 'service worker');
include(sw, 'await downloadBen2Model(', 'service worker');
include(sw, 'await reapStaleBen2ModelStaging();', 'service worker');
include(sw, "respond({ type: 'heartbeat' })", 'service worker');
include(sw, 'ben2ModelAsset.path,', 'service worker');
exclude(sw, 'event.data.urls', 'service worker');
exclude(sw, 'event.data.url', 'service worker');
exclude(sw, 'event.data.path', 'service worker');
exclude(sw, 'event.data.role', 'service worker');
exclude(sw, 'event.data.cacheName', 'service worker');
exclude(sw, 'const urls:', 'service worker');

include(bridge, 'ben2CacheStatus(): Promise<Ben2CacheStatus>', 'SW bridge');
include(bridge, 'downloadBen2Model(): Promise<void>', 'SW bridge');
include(bridge, "action: 'ben2-cache-status'", 'SW bridge');
include(bridge, "action: 'ben2-download-model'", 'SW bridge');
include(bridge, "event.data?.type === 'heartbeat'", 'SW bridge');
include(bridge, 'ben2ModelDownloadLivenessTimeout', 'SW bridge');
exclude(bridge, 'modelUrl:', 'SW bridge');
exclude(bridge, 'wasmLoaderUrl:', 'SW bridge');
exclude(bridge, 'wasmUrl:', 'SW bridge');
exclude(bridge, 'workerUrl:', 'SW bridge');

const policy = util.slice(
  util.indexOf('export function isCanonicalBen2Request'),
  util.indexOf('export function cacheOrNetworkAndCache'),
);
for (const requirement of [
  "request.method === 'GET'",
  'url.origin === self.location.origin',
  "url.search === ''",
  "!request.headers.has('range')",
  "response.type !== 'opaque' && response.status === 200",
  'isCanonicalBen2Request(request)',
  'isAdmissibleBen2Response(response)',
  'responseToCache = response.clone()',
  'cache.put(request, responseToCache)',
  'event.waitUntil(cacheWrite.catch(() => undefined))',
  'const cacheNames = await caches.keys()',
  'caches.match(request, { cacheName })',
  'await cache.put(stagingRequest, stagingResponse)',
  'await cache.delete(stagingRequest)',
  '?sw-model-validation-staging',
  "const ben2ValidationHeader = 'X-Squoosh-BEN2-Validated'",
])
  include(policy, requirement, 'BEN2 cache policy');
exclude(policy, 'caches.match(event.request', 'BEN2 cache policy');

console.log('PASS six-role BEN2 inventory and current-cache source contract');
