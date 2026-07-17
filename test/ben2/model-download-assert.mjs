#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = new URL('../../', import.meta.url);

async function compile(file) {
  return ts.transpileModule(await readFile(new URL(file, root), 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

const plain = (value) => JSON.parse(JSON.stringify(value));
const origin = 'https://squoosh.test';
const modelPath = '/c/model_fp16-current.onnx';
const modelBytes = 219_121_675;
const stagingUrl = `${origin}${modelPath}?sw-model-validation-staging`;
const inventory = [
  { role: 'features_worker', path: '/c/features-worker.js' },
  { role: 'model', path: modelPath, bytes: modelBytes },
  { role: 'ort_asyncify_mjs', path: '/c/ort.mjs' },
  { role: 'ort_asyncify_wasm', path: '/c/ort.wasm' },
  { role: 'png_decoder_js', path: '/c/png.js' },
  { role: 'png_decoder_wasm', path: '/c/png.wasm' },
];
const ben2Assets = inventory.map(({ path }) => path);

function byteStream(length, { fail = false } = {}) {
  const chunk = new Uint8Array(Math.min(length || 1, 32 * 1024 * 1024));
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
      if (fail) controller.error(new Error('truncated'));
      else controller.close();
    },
  });
}

function networkResponse(
  length,
  { status = 200, type = 'basic', headers = {}, fail = false } = {},
) {
  return {
    status,
    statusText: status === 200 ? '' : 'failed',
    type,
    headers: new Headers(headers),
    body: byteStream(length, { fail }),
    clone() {
      return new Response(byteStream(length, { fail }), {
        status,
        headers,
      });
    },
  };
}

async function snapshotResponse(response) {
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

function restoreResponse(snapshot) {
  return new Response(byteStream(snapshot.bytes), {
    status: snapshot.status,
    statusText: snapshot.statusText,
    headers: snapshot.headers,
  });
}

const listeners = new Map();
const addListener = (type, listener) => {
  const values = listeners.get(type) || [];
  values.push(listener);
  listeners.set(type, values);
};

let fetchCalls;
let fetchImplementation;
let fetchStarted;
let openCalls;
let putCalls;
let deleteCalls;
let openFailure;
let putFailure;
let putGate;
let putStarted;
let stagingStored;
let stagingReadGate;
const stored = new Map();
const keyFor = (request) =>
  typeof request === 'string' ? request : request.url;
const cache = {
  async match(request) {
    const key = keyFor(request);
    if (key === stagingUrl && stagingReadGate) await stagingReadGate.promise;
    const snapshot = stored.get(key);
    return snapshot && restoreResponse(snapshot);
  },
  async put(request, response) {
    putCalls++;
    putStarted?.resolve();
    if (putGate) await putGate.promise;
    if (putFailure) throw putFailure;
    const key = keyFor(request);
    stored.set(key, await snapshotResponse(response));
    if (key === stagingUrl) stagingStored?.resolve();
  },
  async delete(request) {
    deleteCalls++;
    return stored.delete(keyFor(request));
  },
};
const caches = {
  async match(request, options) {
    assert.equal(options?.cacheName, 'static-v1');
    return cache.match(request);
  },
  async open(name) {
    openCalls++;
    assert.equal(name, 'static-v1');
    if (openFailure) throw openFailure;
    return cache;
  },
  async keys() {
    return stored.size ? ['static-v1'] : [];
  },
  async delete() {},
};
const fetch = async (request) => {
  fetchCalls.push(request);
  fetchStarted?.resolve();
  return fetchImplementation(request);
};

const utilModule = { exports: {} };
vm.runInNewContext(await compile('src/sw/util.ts'), {
  exports: utilModule.exports,
  module: utilModule,
  require(specifier) {
    if (specifier === './to-cache') return { initial: [], theRest: [] };
    throw new Error(`Unexpected util import: ${specifier}`);
  },
  self: {
    location: { origin },
    clients: { get: async () => undefined },
    addEventListener: addListener,
  },
  location: { origin },
  caches,
  fetch,
  URL,
  Request,
  Response,
  Headers,
  TransformStream,
  Promise,
  Map,
});

const swCompiled = await compile('src/sw/index.ts');
function loadServiceWorker() {
  const swListeners = new Map();
  const heartbeatTimers = new Map();
  let nextHeartbeatTimer = 0;
  const swModule = { exports: {} };
  vm.runInNewContext(swCompiled, {
    exports: swModule.exports,
    module: swModule,
    require(specifier) {
      if (specifier === './util') return utilModule.exports;
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
      location: { origin },
      clients: { claim() {} },
      addEventListener(type, listener) {
        const values = swListeners.get(type) || [];
        values.push(listener);
        swListeners.set(type, values);
      },
      skipWaiting() {},
    },
    location: { origin },
    VERSION: 'v1',
    ASSETS: [],
    caches,
    fetch,
    URL,
    Request,
    Response,
    Headers,
    TransformStream,
    Promise,
    setInterval(callback, delay) {
      assert.ok(delay > 0 && delay <= 10_000, 'heartbeat cadence is bounded');
      const id = ++nextHeartbeatTimer;
      heartbeatTimers.set(id, callback);
      return id;
    },
    clearInterval(id) {
      heartbeatTimers.delete(id);
    },
  });
  return { listeners: swListeners, heartbeatTimers };
}

const activeServiceWorker = loadServiceWorker();
const fetchListener = activeServiceWorker.listeners.get('fetch').at(-1);
const messageListener = activeServiceWorker.listeners.get('message').at(-1);
assert.equal(typeof fetchListener, 'function');
assert.equal(typeof messageListener, 'function');

function reset() {
  stored.clear();
  fetchCalls = [];
  fetchStarted = deferred();
  openCalls = 0;
  putCalls = 0;
  deleteCalls = 0;
  openFailure = undefined;
  putFailure = undefined;
  putGate = undefined;
  putStarted = deferred();
  stagingStored = deferred();
  stagingReadGate = undefined;
  fetchImplementation = async () => networkResponse(modelBytes);
}

async function storeRaw(url, length, headers = {}) {
  stored.set(url, {
    bytes: length,
    status: 200,
    statusText: '',
    headers: Object.entries(headers),
  });
}

async function dispatchFetch(url = `${origin}${modelPath}`) {
  let responsePromise;
  const event = {
    request: new Request(url),
    respondWith(value) {
      responsePromise = Promise.resolve(value);
    },
    waitUntil() {},
  };
  fetchListener(event);
  assert.ok(responsePromise, 'model fetch must be intercepted');
  return responsePromise;
}

function dispatchMessage(
  data = { action: 'ben2-download-model' },
  listener = messageListener,
) {
  const replies = [];
  const lifetimes = [];
  listener({
    data,
    ports: [{ postMessage: (message) => replies.push(message) }],
    waitUntil(promise) {
      lifetimes.push(Promise.resolve(promise));
    },
  });
  assert.equal(lifetimes.length, 1, 'download owns one event lifetime');
  return { replies, done: Promise.all(lifetimes) };
}

async function dispatchActivate(serviceWorker = activeServiceWorker) {
  const lifetimes = [];
  serviceWorker.listeners.get('activate').at(-1)({
    waitUntil(promise) {
      lifetimes.push(Promise.resolve(promise));
    },
  });
  assert.equal(lifetimes.length, 1, 'activation owns one event lifetime');
  await Promise.all(lifetimes);
}

async function statusModelCached(listener = messageListener) {
  const request = dispatchMessage({ action: 'ben2-cache-status' }, listener);
  await request.done;
  assert.equal(request.replies[0].ok, true);
  return request.replies[0].entries.find(({ role }) => role === 'model').cached;
}

async function assertFailedAttempt(label, configure) {
  reset();
  configure();
  const attempt = dispatchMessage();
  await attempt.done;
  assert.deepEqual(
    plain(attempt.replies),
    [{ ok: false, error: 'model-download-failed' }],
    label,
  );
  assert.equal(await statusModelCached(), false, `${label} status is absent`);
  const response = await dispatchFetch();
  assert.equal(response.status, 404, `${label} cannot be served`);
  assert.equal(
    stored.has(`${origin}${modelPath}`),
    false,
    `${label} canonical entry is absent`,
  );
}

const utilSource = await readFile(new URL('src/sw/util.ts', root), 'utf8');
assert.match(
  utilSource,
  /\?sw-model-validation-staging/,
  'staging uses a neutral SW-owned validation key',
);
assert.doesNotMatch(
  utilSource,
  /\?ben2(?:\b|=)/i,
  'staging cannot resemble legacy BEN2 query transport',
);

// Ordinary model requests are current-cache-only, and stale unmarked entries
// are evicted rather than served or reported as cached.
reset();
let response = await dispatchFetch();
assert.equal(response.status, 404);
assert.deepEqual([fetchCalls.length, openCalls, putCalls], [0, 0, 0]);
await storeRaw(`${origin}${modelPath}`, 12);
response = await dispatchFetch();
assert.equal(response.status, 404);
assert.equal(await statusModelCached(), false);
assert.equal(stored.has(`${origin}${modelPath}`), false);

// The SW ignores all caller-selected identity and validates exactly its model.
reset();
const malicious = dispatchMessage({
  action: 'ben2-download-model',
  url: 'https://attacker.test/model',
  path: '/attacker',
  bytes: 1,
  role: 'features_worker',
  cacheName: 'attacker-cache',
});
await malicious.done;
assert.deepEqual(plain(malicious.replies), [{ ok: true }]);
assert.equal(fetchCalls.length, 1);
assert.equal(fetchCalls[0].url, `${origin}${modelPath}`);
assert.equal(fetchCalls[0].method, 'GET');
assert.equal(await statusModelCached(), true);
assert.ok(stored.has(`${origin}${modelPath}`));
assert.equal(
  stored.get(`${origin}${modelPath}`).bytes,
  modelBytes,
  'admitted canonical entry contains exactly the SW-owned byte count',
);

// The validated marker makes subsequent status/fetch/download checks O(1): no
// body reread, network request, or new CacheStorage write.
const validatedSnapshot = stored.get(`${origin}${modelPath}`);
assert.ok(
  validatedSnapshot.headers.some(([name]) =>
    name.toLowerCase().includes('ben2'),
  ),
  'validated persistence owns a BEN2 marker header',
);
fetchCalls = [];
putCalls = 0;
response = await dispatchFetch();
assert.equal(response.status, 200);
const existing = dispatchMessage();
await existing.done;
assert.deepEqual(plain(existing.replies), [{ ok: true }]);
assert.deepEqual([fetchCalls.length, putCalls], [0, 0]);

// Concurrent clients share fetch/validation/promotion and reply only after the
// final canonical put, never while only a staging entry exists.
reset();
const networkGate = deferred();
putGate = deferred();
fetchImplementation = async () => {
  await networkGate.promise;
  return networkResponse(modelBytes);
};
const first = dispatchMessage();
const second = dispatchMessage();
await fetchStarted.promise;
assert.equal(fetchCalls.length, 1);
networkGate.resolve();
await putStarted.promise;
assert.equal(putCalls, 1, 'first write is non-qualifying staging');
assert.equal(await statusModelCached(), false);
assert.equal((await dispatchFetch()).status, 404);
assert.deepEqual(first.replies, []);
assert.deepEqual(second.replies, []);
assert.equal(
  activeServiceWorker.heartbeatTimers.size,
  2,
  'each live deduplicated port owns a heartbeat',
);
for (const heartbeat of activeServiceWorker.heartbeatTimers.values())
  heartbeat();
assert.deepEqual(plain(first.replies), [{ type: 'heartbeat' }]);
assert.deepEqual(plain(second.replies), [{ type: 'heartbeat' }]);
putGate.resolve();
await Promise.all([first.done, second.done]);
assert.deepEqual(plain(first.replies), [{ type: 'heartbeat' }, { ok: true }]);
assert.deepEqual(plain(second.replies), [{ type: 'heartbeat' }, { ok: true }]);
assert.equal(
  activeServiceWorker.heartbeatTimers.size,
  0,
  'final settlement clears every port heartbeat',
);
assert.equal(putCalls, 2, 'second write promotes validated canonical entry');
assert.equal(await statusModelCached(), true);

// Status polling in the active process cannot reap the stage owned by the
// in-flight global operation or qualify it before canonical promotion.
reset();
stagingReadGate = deferred();
const activeStaging = dispatchMessage();
await stagingStored.promise;
assert.equal(stored.has(stagingUrl), true);
const deletesBeforeActiveStatus = deleteCalls;
assert.equal(await statusModelCached(), false);
assert.equal(deleteCalls, deletesBeforeActiveStatus);
assert.equal(stored.has(stagingUrl), true, 'active stage survives status reap');
stagingReadGate.resolve();
await activeStaging.done;
assert.equal(await statusModelCached(), true);
assert.equal(stored.has(stagingUrl), false);

// A fresh worker reaps process-loss staging on status and activation without
// reading its model-sized body.
reset();
await storeRaw(stagingUrl, modelBytes);
const statusRestart = loadServiceWorker();
assert.equal(
  await statusModelCached(statusRestart.listeners.get('message').at(-1)),
  false,
);
assert.equal(stored.has(stagingUrl), false, 'restart status reaps orphan');
reset();
await storeRaw(stagingUrl, modelBytes);
const activationRestart = loadServiceWorker();
await dispatchActivate(activationRestart);
assert.equal(stored.has(stagingUrl), false, 'activation reaps orphan');

// Both failed and successful explicit retries reap a process-loss orphan
// before fetch; success leaves only the canonical validated entry.
reset();
await storeRaw(stagingUrl, modelBytes);
fetchImplementation = async () => {
  assert.equal(stored.has(stagingUrl), false, 'retry reaps before fetch');
  throw new Error('network failed after restart');
};
const failedRestartRetry = dispatchMessage();
await failedRestartRetry.done;
assert.equal(failedRestartRetry.replies.at(-1).ok, false);
assert.equal(stored.has(stagingUrl), false);
reset();
await storeRaw(stagingUrl, modelBytes);
const successfulRestartRetry = dispatchMessage();
await successfulRestartRetry.done;
assert.deepEqual(plain(successfulRestartRetry.replies.at(-1)), { ok: true });
assert.deepEqual([...stored.keys()], [`${origin}${modelPath}`]);
assert.equal(await statusModelCached(), true);

await assertFailedAttempt('clean short body', () => {
  fetchImplementation = async () => networkResponse(modelBytes - 1);
});
await assertFailedAttempt('overlong body', () => {
  fetchImplementation = async () => networkResponse(modelBytes + 1);
});
await assertFailedAttempt('short body claiming exact Content-Length', () => {
  fetchImplementation = async () =>
    networkResponse(modelBytes - 1, {
      headers: { 'Content-Length': String(modelBytes) },
    });
});

// Admission counts stream bytes and therefore accepts an exact body despite a
// misleading header. The persisted canonical Content-Length is corrected.
reset();
fetchImplementation = async () =>
  networkResponse(modelBytes, { headers: { 'Content-Length': '5' } });
const misleading = dispatchMessage();
await misleading.done;
assert.deepEqual(plain(misleading.replies), [{ ok: true }]);
assert.equal(await statusModelCached(), true);
assert.equal(
  new Headers(stored.get(`${origin}${modelPath}`).headers).get(
    'content-length',
  ),
  String(modelBytes),
);

await assertFailedAttempt('network rejection', () => {
  fetchImplementation = async () => {
    throw new Error('network failed');
  };
});
await assertFailedAttempt('abort', () => {
  fetchImplementation = async () => {
    throw new DOMException('aborted', 'AbortError');
  };
});
await assertFailedAttempt('non-200', () => {
  fetchImplementation = async () => networkResponse(2, { status: 503 });
});
await assertFailedAttempt('opaque', () => {
  fetchImplementation = async () => ({
    type: 'opaque',
    status: 0,
    clone: () => assert.fail('opaque response cannot clone'),
  });
});
await assertFailedAttempt('clone failure', () => {
  fetchImplementation = async () => ({
    type: 'basic',
    status: 200,
    clone() {
      throw new TypeError('clone failed');
    },
  });
});
await assertFailedAttempt('cache open failure', () => {
  openFailure = new Error('open failed');
});
await assertFailedAttempt('quota/put failure', () => {
  putFailure = new Error('quota exceeded');
});
await assertFailedAttempt('errored stream', () => {
  fetchImplementation = async () => networkResponse(7, { fail: true });
});

// An unmarked current entry is removed before retry, and every rejected
// operation clears SW dedupe so a fresh explicit operation can succeed.
reset();
await storeRaw(`${origin}${modelPath}`, modelBytes);
fetchImplementation = async () => {
  if (fetchCalls.length === 1) throw new Error('first fails');
  return networkResponse(modelBytes);
};
const failed = dispatchMessage();
await failed.done;
assert.equal(failed.replies[0].ok, false);
assert.equal(stored.has(`${origin}${modelPath}`), false);
const retry = dispatchMessage();
await retry.done;
assert.deepEqual(plain(retry.replies), [{ ok: true }]);
assert.equal(fetchCalls.length, 2);
assert.equal(await statusModelCached(), true);

// A failed final canonical write cannot expose the validated staging body.
reset();
let writesBeforeFailure = 0;
const originalPut = cache.put;
cache.put = async (request, body) => {
  writesBeforeFailure++;
  if (writesBeforeFailure === 2) throw new Error('final write failed');
  return originalPut.call(cache, request, body);
};
const failedFinalWrite = dispatchMessage();
await failedFinalWrite.done;
cache.put = originalPut;
assert.deepEqual(plain(failedFinalWrite.replies), [
  { ok: false, error: 'model-download-failed' },
]);
assert.equal(await statusModelCached(), false);
assert.equal((await dispatchFetch()).status, 404);
assert.equal(
  [...stored.keys()].some((key) => key.startsWith(`${origin}${modelPath}`)),
  false,
  'failed promotion cleans canonical and staging entries',
);

// Non-model BEN2 roles retain the existing lazy cache helper route.
reset();
fetchImplementation = async () => networkResponse(5);
const runtimeResponse = await dispatchFetch(`${origin}/c/ort.mjs`);
assert.equal(runtimeResponse.status, 200);
assert.equal(fetchCalls.length, 1);
assert.equal(putCalls, 1);

console.log('PASS exact SW-owned BEN2 model download lifecycle');
