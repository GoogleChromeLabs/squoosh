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
const inventory = [
  { role: 'features_worker', path: '/c/features-worker.js' },
  { role: 'model', path: modelPath },
  { role: 'ort_asyncify_mjs', path: '/c/ort.mjs' },
  { role: 'ort_asyncify_wasm', path: '/c/ort.wasm' },
  { role: 'png_decoder_js', path: '/c/png.js' },
  { role: 'png_decoder_wasm', path: '/c/png.wasm' },
];
const ben2Assets = inventory.map(({ path }) => path);

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
const stored = new Map();
const keyFor = (request) =>
  typeof request === 'string' ? request : request.url;
const cache = {
  async match(request) {
    return stored.get(keyFor(request));
  },
  async put(request, response) {
    putCalls++;
    putStarted?.resolve();
    if (putGate) await putGate.promise;
    if (putFailure) throw putFailure;
    await response.arrayBuffer();
    stored.set(keyFor(request), new Response('cached model'));
  },
  async delete(request) {
    deleteCalls++;
    return stored.delete(keyFor(request));
  },
};
const caches = {
  async match(request, options) {
    assert.equal(options?.cacheName, 'static-v1');
    return stored.get(keyFor(request));
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
  Promise,
  Map,
});

const swModule = { exports: {} };
vm.runInNewContext(await compile('src/sw/index.ts'), {
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
    addEventListener: addListener,
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
  Promise,
});

const fetchListener = listeners.get('fetch').at(-1);
const messageListener = listeners.get('message').at(-1);
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
  fetchImplementation = async () => new Response('model', { status: 200 });
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

function dispatchMessage(data = { action: 'ben2-download-model' }) {
  const replies = [];
  const lifetimes = [];
  messageListener({
    data,
    ports: [{ postMessage: (message) => replies.push(message) }],
    waitUntil(promise) {
      lifetimes.push(Promise.resolve(promise));
    },
  });
  assert.equal(lifetimes.length, 1, 'download owns one event lifetime');
  return { replies, done: Promise.all(lifetimes) };
}

// Ordinary model requests are current-cache-only.
reset();
let response = await dispatchFetch();
assert.equal(response.status, 404);
assert.deepEqual([fetchCalls.length, openCalls, putCalls], [0, 0, 0]);
stored.set(`${origin}${modelPath}`, new Response('already cached'));
response = await dispatchFetch();
assert.equal(await response.text(), 'already cached');
assert.deepEqual([fetchCalls.length, openCalls, putCalls], [0, 0, 0]);

// The SW ignores all caller-selected identity and downloads only its model role.
reset();
const malicious = dispatchMessage({
  action: 'ben2-download-model',
  url: 'https://attacker.test/model',
  urls: ['https://attacker.test/model'],
  path: '/attacker',
  role: 'features_worker',
  cacheName: 'attacker-cache',
});
await malicious.done;
assert.deepEqual(plain(malicious.replies), [{ ok: true }]);
assert.equal(fetchCalls.length, 1);
assert.equal(fetchCalls[0].url, `${origin}${modelPath}`);
assert.equal(fetchCalls[0].method, 'GET');
assert.equal(putCalls, 1);
assert.ok(stored.has(`${origin}${modelPath}`));

// Existing current model is a successful no-op.
fetchCalls = [];
putCalls = 0;
const existing = dispatchMessage();
await existing.done;
assert.deepEqual(plain(existing.replies), [{ ok: true }]);
assert.deepEqual([fetchCalls.length, putCalls], [0, 0]);

// Concurrent clients share fetch/persistence and reply only after awaited put.
reset();
const networkGate = deferred();
putGate = deferred();
fetchImplementation = async () => {
  await networkGate.promise;
  return new Response('complete', { status: 200 });
};
const first = dispatchMessage();
const second = dispatchMessage();
await fetchStarted.promise;
assert.equal(fetchCalls.length, 1);
networkGate.resolve();
await putStarted.promise;
assert.equal(putCalls, 1);
assert.deepEqual(first.replies, []);
assert.deepEqual(second.replies, []);
putGate.resolve();
await Promise.all([first.done, second.done]);
assert.deepEqual(plain(first.replies), [{ ok: true }]);
assert.deepEqual(plain(second.replies), [{ ok: true }]);
assert.ok(stored.has(`${origin}${modelPath}`));

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
  assert.equal(
    stored.has(`${origin}${modelPath}`),
    false,
    `${label} not cached`,
  );
}

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
  fetchImplementation = async () => new Response('no', { status: 503 });
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
await assertFailedAttempt('partial stream failure', () => {
  fetchImplementation = async () =>
    new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('partial'));
          controller.error(new Error('truncated'));
        },
      }),
      { status: 200 },
    );
});

// A rejected operation clears SW dedupe and can be retried.
reset();
fetchImplementation = async () => {
  if (fetchCalls.length === 1) throw new Error('first fails');
  return new Response('retry complete', { status: 200 });
};
const failed = dispatchMessage();
await failed.done;
assert.equal(failed.replies[0].ok, false);
const retry = dispatchMessage();
await retry.done;
assert.deepEqual(plain(retry.replies), [{ ok: true }]);
assert.equal(fetchCalls.length, 2);
assert.ok(stored.has(`${origin}${modelPath}`));

// Non-model BEN2 roles retain the existing lazy cache helper route.
reset();
const runtimeResponse = await dispatchFetch(`${origin}/c/ort.mjs`);
assert.equal(runtimeResponse.status, 200);
assert.equal(fetchCalls.length, 1);
assert.equal(putCalls, 1);

console.log('PASS explicit SW-owned BEN2 model download lifecycle');
