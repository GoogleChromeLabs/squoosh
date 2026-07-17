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
const expectedBytes = 219_121_675;
const cacheName = 'squoosh-ben2-model-v1';

function byteStream(length, { fail = false } = {}) {
  const chunk = new Uint8Array(Math.min(Math.max(length, 1), 1024 * 1024));
  let remaining = length;
  return new ReadableStream({
    pull(controller) {
      if (remaining > 0) {
        const size = Math.min(remaining, chunk.byteLength);
        remaining -= size;
        controller.enqueue(
          size === chunk.byteLength ? chunk : chunk.subarray(0, size),
        );
        return;
      }
      if (fail) controller.error(new Error('network body failed'));
      else controller.close();
    },
  });
}

function networkResponse(
  length,
  {
    status = 200,
    type = 'basic',
    body = true,
    fail = false,
    headers = {},
  } = {},
) {
  return {
    status,
    statusText: status === 200 ? '' : 'failed',
    type,
    headers: new Headers(headers),
    body: body ? byteStream(length, { fail }) : null,
  };
}

async function snapshot(response) {
  let bytes = 0;
  const reader = response.body?.getReader();
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
    }
  }
  return {
    bytes,
    status: response.status,
    statusText: response.statusText,
    headers: [...response.headers.entries()],
  };
}

function restored(value) {
  return new Response(byteStream(value.bytes), {
    status: value.status,
    statusText: value.statusText,
    headers: value.headers,
  });
}

function keyOf(request) {
  return typeof request === 'string' ? request : request.url;
}

function createStorage() {
  const stores = new Map();
  let openCalls = 0;
  let putCalls = 0;
  let deleteCalls = 0;
  let openFailure;
  let putFailureAt;

  const cacheFor = (name) => {
    let store = stores.get(name);
    if (!store) {
      store = new Map();
      stores.set(name, store);
    }
    return {
      async match(request) {
        const value = store.get(keyOf(request));
        return value && restored(value);
      },
      async put(request, response) {
        putCalls++;
        if (putFailureAt === putCalls) throw new Error('cache put failed');
        store.set(keyOf(request), await snapshot(response));
      },
      async delete(request) {
        deleteCalls++;
        return store.delete(keyOf(request));
      },
      async keys() {
        return [...store.keys()].map((url) => new Request(url));
      },
    };
  };

  return {
    caches: {
      async keys() {
        return [...stores.keys()];
      },
      async open(name) {
        openCalls++;
        if (openFailure) throw openFailure;
        return cacheFor(name);
      },
      async delete(name) {
        return stores.delete(name);
      },
    },
    stores,
    cacheFor,
    setOpenFailure(error) {
      openFailure = error;
    },
    setPutFailureAt(index) {
      putFailureAt = index;
    },
    get openCalls() {
      return openCalls;
    },
    get putCalls() {
      return putCalls;
    },
    get deleteCalls() {
      return deleteCalls;
    },
  };
}

function lockManager() {
  let queue = Promise.resolve();
  return {
    request(_name, callback) {
      const result = queue.then(callback, callback);
      queue = result.catch(() => undefined);
      return result;
    },
  };
}

const sourcePath = new URL(
  'src/features/processors/ben2/shared/model-cache.ts',
  root,
);
const source = await readFile(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

function loadModule({ storage = createStorage(), fetchImpl, locks } = {}) {
  const fetchCalls = [];
  let serviceWorkerReads = 0;
  const navigator = new Proxy(
    { locks },
    {
      get(target, property) {
        if (property === 'serviceWorker') {
          serviceWorkerReads++;
          throw new Error('service worker access is forbidden');
        }
        return target[property];
      },
    },
  );
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    exports: module.exports,
    module,
    require(specifier) {
      if (specifier.startsWith('url:../../../../../'))
        return { default: modelPath };
      if (specifier === './meta') return { modelBytes: expectedBytes };
      throw new Error(`Unexpected model-cache import: ${specifier}`);
    },
    caches: storage.caches,
    fetch: async (request) => {
      fetchCalls.push(request);
      return (fetchImpl || (() => networkResponse(expectedBytes)))(request);
    },
    navigator,
    location: { href: `${origin}/editor`, origin },
    URL,
    Request,
    Response,
    Headers,
    ReadableStream,
    TransformStream,
    Uint8Array,
    ArrayBuffer,
    DOMException,
    Error,
    Promise,
    Math,
    Date,
    crypto: { randomUUID: () => 'test-stage' },
  });
  return {
    api: module.exports,
    storage,
    fetchCalls,
    get serviceWorkerReads() {
      return serviceWorkerReads;
    },
  };
}

function entries(storage, name = cacheName) {
  return storage.stores.get(name) || new Map();
}

// A no-controller page directly fetches the one build-owned URL and promotes it.
{
  const loaded = loadModule();
  assert.equal(loaded.api.downloadBen2Model.length, 0);
  assert.equal(loaded.api.ben2ModelIsCached.length, 0);
  await loaded.api.downloadBen2Model({ url: 'https://attacker.test/model' });
  assert.equal(loaded.serviceWorkerReads, 0);
  assert.equal(loaded.fetchCalls.length, 1);
  assert.equal(loaded.fetchCalls[0].url, modelUrl);
  assert.equal(loaded.fetchCalls[0].method, 'GET');
  assert.equal(loaded.fetchCalls[0].redirect, 'error');
  assert.equal(
    loaded.fetchCalls[0].headers.get('X-Squoosh-BEN2-Download'),
    'v1',
  );
  assert.equal(await loaded.api.ben2ModelIsCached(), true);
  assert.deepEqual([...entries(loaded.storage).keys()], [modelUrl]);
  assert.equal(loaded.api.ben2ModelCacheName, cacheName);
}

// Simultaneous callers share one in-page operation, and failure clears for retry.
{
  let release;
  let attempts = 0;
  const loaded = loadModule({
    fetchImpl: async () => {
      attempts++;
      if (attempts === 1) {
        await new Promise((resolve) => (release = resolve));
        throw new Error('offline');
      }
      return networkResponse(expectedBytes);
    },
  });
  const first = loaded.api.downloadBen2Model();
  const second = loaded.api.downloadBen2Model();
  assert.equal(first, second);
  while (!release) await Promise.resolve();
  release();
  await assert.rejects(first, /offline/);
  assert.equal(await loaded.api.ben2ModelIsCached(), false);
  await loaded.api.downloadBen2Model();
  assert.equal(attempts, 2);
  assert.equal(await loaded.api.ben2ModelIsCached(), true);
}

// Two separately evaluated page modules serialize through Web Locks and recheck.
{
  const storage = createStorage();
  const locks = lockManager();
  let fetches = 0;
  const options = {
    storage,
    locks,
    fetchImpl: () => {
      fetches++;
      return networkResponse(expectedBytes);
    },
  };
  await Promise.all([
    loadModule(options).api.downloadBen2Model(),
    loadModule(options).api.downloadBen2Model(),
  ]);
  assert.equal(fetches, 1);
}

// Every admission failure leaves neither a qualifying canonical entry nor stage.
for (const test of [
  { name: 'short', response: () => networkResponse(expectedBytes - 1) },
  { name: 'overlong', response: () => networkResponse(expectedBytes + 1) },
  {
    name: 'errored body',
    response: () => networkResponse(expectedBytes - 1, { fail: true }),
  },
  { name: 'non-200', response: () => networkResponse(0, { status: 503 }) },
  { name: 'opaque', response: () => networkResponse(0, { type: 'opaque' }) },
  {
    name: 'missing body',
    response: () => networkResponse(0, { body: false }),
  },
  {
    name: 'fetch rejection',
    response: () => Promise.reject(new Error('fetch failed')),
  },
  {
    name: 'lying content length',
    response: () =>
      networkResponse(3, {
        headers: { 'Content-Length': String(expectedBytes) },
      }),
  },
]) {
  const loaded = loadModule({ fetchImpl: test.response });
  await assert.rejects(loaded.api.downloadBen2Model(), undefined, test.name);
  assert.equal(await loaded.api.ben2ModelIsCached(), false, test.name);
  assert.equal(entries(loaded.storage).size, 0, test.name);
}

for (const failure of ['open', 'stage-put', 'final-put']) {
  const storage = createStorage();
  if (failure === 'open')
    storage.setOpenFailure(new Error('cache open failed'));
  if (failure === 'stage-put') storage.setPutFailureAt(1);
  if (failure === 'final-put') storage.setPutFailureAt(2);
  const loaded = loadModule({ storage });
  await assert.rejects(loaded.api.downloadBen2Model(), undefined, failure);
  if (failure !== 'open') {
    assert.equal(await loaded.api.ben2ModelIsCached(), false, failure);
    assert.equal(entries(storage).size, 0, failure);
  }
}

// Status ignores unrelated caches, evicts invalid canonical metadata, and does
// not create a dedicated cache for an absent poll.
{
  const storage = createStorage();
  const staticCache = storage.cacheFor('static-old');
  await staticCache.put(modelUrl, new Response('legacy', { status: 200 }));
  const loaded = loadModule({ storage });
  assert.equal(await loaded.api.ben2ModelIsCached(), false);
  assert.equal(storage.stores.has(cacheName), false);

  const dedicated = storage.cacheFor(cacheName);
  await dedicated.put(modelUrl, new Response('unmarked', { status: 200 }));
  assert.equal(await loaded.api.ben2ModelIsCached(), false);
  assert.equal(entries(storage).has(modelUrl), false);
}

// Explicit eviction removes canonical/staging entries, while a locked pass
// reaps stale stages before admitting exactly one canonical response.
{
  const storage = createStorage();
  const dedicated = storage.cacheFor(cacheName);
  await dedicated.put(
    `${modelUrl}?ben2-model-staging=stale`,
    new Response('stale'),
  );
  const loaded = loadModule({ storage, locks: lockManager() });
  await loaded.api.downloadBen2Model();
  assert.deepEqual([...entries(storage).keys()], [modelUrl]);
  await loaded.api.evictBen2Model();
  assert.equal(entries(storage).size, 0);
}

// The worker-facing read materializes exactly one typed view and never fetches.
{
  const marker = `v1;url=${encodeURIComponent(
    modelUrl,
  )};bytes=${expectedBytes}`;
  let deleted = 0;
  const response = {
    type: 'basic',
    status: 200,
    headers: new Headers({
      'Content-Length': String(expectedBytes),
      'X-Squoosh-BEN2-Validated': marker,
    }),
    async arrayBuffer() {
      return new ArrayBuffer(expectedBytes);
    },
  };
  const storage = {
    caches: {
      async keys() {
        return [cacheName];
      },
      async open(name) {
        assert.equal(name, cacheName);
        return {
          async match() {
            return response;
          },
          async delete() {
            deleted++;
            return true;
          },
        };
      },
    },
  };
  const loaded = loadModule({
    storage,
    fetchImpl: () => assert.fail('cached-byte read must not fetch'),
  });
  const bytes = await loaded.api.readCachedBen2ModelBytes();
  assert.equal(bytes instanceof Uint8Array, true);
  assert.equal(bytes.byteLength, expectedBytes);
  assert.equal(loaded.fetchCalls.length, 0);
  assert.equal(deleted, 0);

  response.arrayBuffer = async () => new ArrayBuffer(7);
  await assert.rejects(
    loaded.api.readCachedBen2ModelBytes(),
    (error) => error?.name === 'Ben2ModelNotCachedError',
  );
  assert.equal(deleted, 1, 'a corrupt body is evicted');
}

// The SW predicate admits only the fixed canonical internal request.
{
  const { api } = loadModule();
  const internal = new Request(modelUrl, {
    headers: { 'X-Squoosh-BEN2-Download': 'v1' },
  });
  assert.equal(api.isBen2ModelDownloadRequest(internal), true);
  assert.equal(api.isBen2ModelDownloadRequest(new Request(modelUrl)), false);
  assert.equal(
    api.isBen2ModelDownloadRequest(
      new Request(`${modelUrl}?x=1`, {
        headers: { 'X-Squoosh-BEN2-Download': 'v1' },
      }),
    ),
    false,
  );
  assert.equal(
    api.isBen2ModelDownloadRequest(
      new Request('https://attacker.test/c/model_fp16-current.onnx', {
        headers: { 'X-Squoosh-BEN2-Download': 'v1' },
      }),
    ),
    false,
  );
}

console.log('PASS direct BEN2 model CacheStorage authority');
