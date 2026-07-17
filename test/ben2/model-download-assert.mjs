#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = new URL('../../', import.meta.url);
const origin = 'https://squoosh.test';
const modelPath = '/c/model_fp16-current.onnx';
const modelUrl = origin + modelPath;
const inventory = [
  { role: 'features_worker', path: '/c/features-worker.js' },
  { role: 'model', path: modelPath, bytes: 219_121_675 },
  { role: 'ort_asyncify_mjs', path: '/c/ort.mjs' },
  { role: 'ort_asyncify_wasm', path: '/c/ort.wasm' },
  { role: 'png_decoder_js', path: '/c/png.js' },
  { role: 'png_decoder_wasm', path: '/c/png.wasm' },
];
const ben2Assets = inventory.map(({ path }) => path);
const source = await readFile(new URL('src/sw/index.ts', root), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

const listeners = new Map();
const fetchCalls = [];
const lazyCalls = [];
const deletedCaches = [];
let matchedModel;
let cacheNames = [];
const modelModule = {
  ben2ModelCacheName: 'squoosh-ben2-model-v1',
  isBen2ModelDownloadRequest(request) {
    return (
      request.method === 'GET' &&
      request.url === modelUrl &&
      request.headers.get('X-Squoosh-BEN2-Download') === 'v1' &&
      !request.headers.has('range')
    );
  },
  async matchValidatedBen2Model() {
    return matchedModel;
  },
};
const util = {
  cacheBen2Asset(event, cacheName) {
    lazyCalls.push({ event, cacheName });
    event.respondWith(Promise.resolve(new Response('lazy')));
  },
  cacheOrNetworkAndCache() {},
  cleanupCache() {},
  cacheOrNetwork() {},
  cacheBasics: async () => {},
  cacheAdditionalProcessors: async () => {},
  serveShareTarget() {},
};
const module = { exports: {} };
vm.runInNewContext(compiled, {
  exports: module.exports,
  module,
  require(specifier) {
    if (specifier === './util') return util;
    if (specifier === 'features/processors/ben2/shared/model-cache') {
      return modelModule;
    }
    if (specifier === 'idb-keyval') return { get: async () => false };
    if (specifier === './to-cache') {
      return {
        ben2AssetInventory: inventory,
        ben2Assets,
        shouldCacheDynamically: () => false,
      };
    }
    throw new Error(`Unexpected SW import: ${specifier}`);
  },
  self: {
    clients: { claim() {} },
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    skipWaiting() {},
  },
  location: { origin },
  VERSION: 'v1',
  ASSETS: [],
  URL,
  Request,
  Response,
  Headers,
  Promise,
  fetch: async (request) => {
    fetchCalls.push(request);
    return new Response('origin-model', { status: 200 });
  },
  caches: {
    async keys() {
      return cacheNames;
    },
    async delete(name) {
      deletedCaches.push(name);
      return true;
    },
  },
});

function dispatchFetch(request) {
  let responsePromise;
  listeners.get('fetch')({
    request,
    respondWith(value) {
      assert.equal(responsePromise, undefined, 'respondWith is called once');
      responsePromise = Promise.resolve(value);
    },
    waitUntil() {},
  });
  return responsePromise;
}

// Only the fixed internal request reaches origin, and its sentinel is stripped.
{
  const response = await dispatchFetch(
    new Request(modelUrl, {
      headers: { 'X-Squoosh-BEN2-Download': 'v1' },
    }),
  );
  assert.equal(await response.text(), 'origin-model');
  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0].url, modelUrl);
  assert.equal(fetchCalls[0].headers.has('X-Squoosh-BEN2-Download'), false);
}

// Ordinary exact model GETs are validated-cache-only, including absence.
{
  matchedModel = new Response('cached-model', {
    headers: { 'X-Squoosh-BEN2-Validated': 'test' },
  });
  const cached = await dispatchFetch(new Request(modelUrl));
  assert.equal(await cached.text(), 'cached-model');
  assert.equal(fetchCalls.length, 1, 'ordinary model GET never reaches origin');

  matchedModel = undefined;
  const absent = await dispatchFetch(new Request(modelUrl));
  assert.equal(absent.status, 404);
  assert.equal(fetchCalls.length, 1);
}

for (const request of [
  new Request(`${modelUrl}?query=1`),
  new Request(modelUrl, { headers: { Range: 'bytes=0-10' } }),
]) {
  const invalid = await dispatchFetch(request);
  assert.equal(invalid.status, 400);
  assert.equal(fetchCalls.length, 1);
}

// The other five generated roles retain their static lazy-cache route.
for (const asset of inventory.filter(({ role }) => role !== 'model')) {
  await dispatchFetch(new Request(origin + asset.path));
}
assert.equal(lazyCalls.length, 5);
assert.ok(lazyCalls.every(({ cacheName }) => cacheName === 'static-v1'));

// Activation preserves the one current dedicated model schema and removes old
// schema/static caches just like every other obsolete cache.
cacheNames = [
  'static-v1',
  'dynamic',
  'squoosh-ben2-model-v1',
  'squoosh-ben2-model-v0',
  'static-old',
];
const lifetimes = [];
listeners.get('activate')({
  waitUntil(promise) {
    lifetimes.push(promise);
  },
});
await Promise.all(lifetimes);
assert.deepEqual(deletedCaches.sort(), [
  'squoosh-ben2-model-v0',
  'static-old',
]);

assert.doesNotMatch(
  source,
  /ben2-cache-status|ben2-download-model|heartbeat|MessageChannel/,
);
console.log('PASS production BEN2 explicit pass-through and cache-only route');
