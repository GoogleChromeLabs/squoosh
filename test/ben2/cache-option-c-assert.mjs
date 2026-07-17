#!/usr/bin/env node
/**
 * Source-evaluation test for the lazy BEN2 FetchEvent cache lifecycle.
 * A fresh eligible response is cloned before response handoff, while cache
 * persistence remains non-fatal and deferred.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const source = fs.readFileSync(path.join(root, 'src/sw/util.ts'), 'utf8');
const cacheBen2AssetSource = source.slice(
  source.indexOf('export function cacheBen2Asset'),
  source.indexOf('export function cacheOrNetworkAndCache'),
);
// This focused test evaluates only the target function, whose TypeScript
// surface has two annotations that can be removed without a compiler.
const compiled = cacheBen2AssetSource
  .replace('export function cacheBen2Asset', 'function cacheBen2Asset')
  .replace('(event: FetchEvent, cacheName: string): void', '(event, cacheName)')
  .replace('let responseToCache: Response;', 'let responseToCache;')
  .concat('\nmodule.exports.cacheBen2Asset = cacheBen2Asset;');

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

class LifecycleFetchEvent {
  constructor(request, { registerResponseLifetime = true } = {}) {
    this.request = request;
    this.registerResponseLifetime = registerResponseLifetime;
    this.dispatching = false;
    this.responded = false;
    this.responsePromise = undefined;
    this.waitUntilPromises = [];
    this.lifetimePromises = [];
    this.pendingLifetimes = new Set();
    this.waitUntilAfterDispatch = [];
  }

  dispatch(listener) {
    this.dispatching = true;
    try {
      listener(this);
    } finally {
      this.dispatching = false;
    }
  }

  respondWith(promise) {
    if (!this.dispatching || this.responded) {
      throw this.invalidState('respondWith must run once during dispatch');
    }
    this.responded = true;
    this.responsePromise = Promise.resolve(promise).then((response) => {
      response.handoff?.();
      return response;
    });
    if (this.registerResponseLifetime)
      this.registerLifetime(this.responsePromise);
  }

  waitUntil(promise) {
    if (!this.dispatching && this.pendingLifetimes.size === 0) {
      throw this.invalidState('waitUntil requires an active event');
    }
    const lifetime = Promise.resolve(promise);
    this.waitUntilAfterDispatch.push(!this.dispatching);
    this.waitUntilPromises.push(lifetime);
    this.registerLifetime(lifetime);
  }

  registerLifetime(promise) {
    this.lifetimePromises.push(promise);
    this.pendingLifetimes.add(promise);
    void promise.then(
      () => this.pendingLifetimes.delete(promise),
      () => this.pendingLifetimes.delete(promise),
    );
  }

  async settleLifetimes() {
    await Promise.allSettled(this.lifetimePromises);
    await Promise.resolve();
  }

  invalidState(message) {
    const error = new Error(message);
    error.name = 'InvalidStateError';
    return error;
  }
}

const canonicalRequest = () =>
  new Request('https://squoosh.test/c/model_fp16-current.onnx');
const assertInvalidState = (fn, message) =>
  assert.throws(fn, (error) => error?.name === 'InvalidStateError', message);

function handoffSensitiveResponse(body, order) {
  let handedOff = false;
  let cloneCalls = 0;
  const cacheClone = { body, cacheBranch: true };
  return {
    type: 'basic',
    status: 200,
    clone() {
      cloneCalls++;
      order?.push('clone');
      if (handedOff) {
        throw new TypeError(
          "Failed to execute 'clone' on 'Response': Response body is already used",
        );
      }
      return cacheClone;
    },
    handoff() {
      handedOff = true;
    },
    cancelClient() {
      handedOff = true;
    },
    get cloneCalls() {
      return cloneCalls;
    },
    cacheClone,
  };
}

const context = {
  URL,
  Response,
  Request,
  ReadableStream,
  TextEncoder,
  Promise,
  Map,
  self: {
    location: { origin: 'https://squoosh.test' },
    addEventListener() {},
  },
  caches: undefined,
  fetch: undefined,
  module: { exports: {} },
};
context.exports = context.module.exports;
vm.runInNewContext(compiled, context, { filename: 'src/sw/util.ts' });

const invoke = (event) =>
  event.dispatch((dispatchedEvent) =>
    context.module.exports.cacheBen2Asset(dispatchedEvent, 'static-test'),
  );

// The response promise is registered synchronously by respondWith. Therefore a
// later waitUntil is legal after dispatch only while response selection remains
// pending. This preserves the lifecycle activity boundary for deferred writes.
{
  const keysGate = deferred();
  const fetchGate = deferred();
  context.caches = {
    async keys() {
      await keysGate.promise;
      return [];
    },
    open() {
      return Promise.resolve({
        match: async () => undefined,
        put: async () => {},
      });
    },
  };
  context.fetch = async () => {
    await fetchGate.promise;
    return new Response('lifecycle', { status: 200 });
  };
  const event = new LifecycleFetchEvent(canonicalRequest(), {
    registerResponseLifetime: false,
  });
  invoke(event);
  assert.equal(event.responded, true, 'respondWith runs during dispatch');
  assert.equal(
    event.dispatching,
    false,
    'dispatch is closed before gates release',
  );
  assert.equal(
    event.pendingLifetimes.size,
    0,
    'no response lifetime is registered',
  );
  keysGate.resolve();
  fetchGate.resolve();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(
    event.waitUntilPromises.length,
    0,
    'inactive events reject waitUntil',
  );
  const error = await event.responsePromise.then(
    () => undefined,
    (reason) => reason,
  );
  assert.equal(
    error?.name,
    'InvalidStateError',
    'late waitUntil without the synchronous response lifetime is illegal',
  );
  assert.equal(event.waitUntilPromises.length, 0);
}

// Regression: caches.open remains pending until after response handoff. The old
// deferred clone then throws body-used and never puts. The fixed source must
// clone exactly once before open/handoff, return promptly, then put that clone.
{
  const openGate = deferred();
  const order = [];
  const response = handoffSensitiveResponse('complete eligible body', order);
  let putArgument;
  context.caches = {
    async keys() {
      return [];
    },
    open() {
      order.push('open');
      return openGate.promise;
    },
  };
  context.fetch = async () => {
    order.push('fetch');
    return response;
  };
  const event = new LifecycleFetchEvent(canonicalRequest());
  invoke(event);
  assert.equal(event.responded, true, 'respondWith runs synchronously');
  assert.equal(
    event.dispatching,
    false,
    'dispatch closes before deferred open',
  );

  const delivered = await event.responsePromise;
  assert.equal(delivered, response, 'original response is promptly delivered');
  assert.deepEqual(
    order,
    ['fetch', 'clone', 'open'],
    'the one cache clone occurs before write-side open and response handoff',
  );
  assert.equal(response.cloneCalls, 1, 'only one cache-branch clone is made');
  assert.equal(
    event.waitUntilPromises.length,
    1,
    'cache lifetime is registered',
  );
  assert.deepEqual(event.waitUntilAfterDispatch, [true]);
  assert.equal(event.pendingLifetimes.size, 1, 'put keeps the event alive');

  // A client can abandon the original only after delivery; this cannot disturb
  // the already-created cache clone. No body is read by source or before put.
  delivered.cancelClient();
  assert.equal(putArgument, undefined, 'response is not gated on cache put');
  openGate.resolve({
    async match() {
      return undefined;
    },
    async put(request, clone) {
      order.push('put');
      assert.equal(request.url, canonicalRequest().url);
      putArgument = clone;
    },
  });
  await event.waitUntilPromises[0];
  await event.settleLifetimes();
  assert.equal(
    putArgument,
    response.cacheClone,
    'Cache.put receives the exact clone',
  );
  assert.equal(
    response.cloneCalls,
    1,
    'no additional clone or body read occurs',
  );
  assert.deepEqual(order, ['fetch', 'clone', 'open', 'put']);
  assertInvalidState(
    () => event.waitUntil(Promise.resolve()),
    'waitUntil fails after all registered lifetimes settle',
  );
}

async function dispatch(request) {
  const event = new LifecycleFetchEvent(request);
  invoke(event);
  return { event, response: await event.responsePromise };
}

let puts = 0;
context.caches = {
  async keys() {
    return [];
  },
  async open() {
    return {
      async match() {
        return undefined;
      },
      async put(_request, response) {
        puts++;
        await response.arrayBuffer();
      },
    };
  },
};

context.fetch = async () => new Response('ignored', { status: 200 });
const query = await dispatch(
  new Request('https://squoosh.test/c/model_fp16-current.onnx?not-canonical'),
);
assert.equal(query.response.status, 200);
assert.equal(query.event.waitUntilPromises.length, 0, 'query never caches');
assert.equal(puts, 0, 'query cannot create or replace an entry');

context.fetch = async () => new Response('failure', { status: 503 });
const failedStatus = await dispatch(canonicalRequest());
assert.equal(failedStatus.response.status, 503);
assert.equal(
  failedStatus.event.waitUntilPromises.length,
  0,
  'non-200 never caches',
);
assert.equal(puts, 0, 'non-200 cannot create or replace an entry');

context.fetch = async () => {
  throw new Error('network failure');
};
const failedFetch = new LifecycleFetchEvent(canonicalRequest());
invoke(failedFetch);
await assert.rejects(failedFetch.responsePromise, /network failure/);
assert.equal(
  failedFetch.waitUntilPromises.length,
  0,
  'fetch failure never caches',
);
assert.equal(puts, 0, 'fetch failure cannot create or replace an entry');

let partialPersisted = false;
context.caches.open = async () => ({
  async match() {
    return undefined;
  },
  async put(_request, response) {
    await response.arrayBuffer();
    partialPersisted = true;
  },
});
context.fetch = async () =>
  new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('partial'));
        controller.error(new Error('truncated body'));
      },
    }),
    { status: 200 },
  );
const truncated = await dispatch(canonicalRequest());
assert.equal(
  truncated.response.status,
  200,
  'truncated response headers are prompt',
);
assert.equal(
  truncated.event.waitUntilPromises.length,
  1,
  'failed put is observed',
);
await truncated.event.waitUntilPromises[0];
assert.equal(partialPersisted, false, 'truncation cannot create an entry');

const unhandledRejections = [];
const observeUnhandled = (reason) => unhandledRejections.push(reason);
process.on('unhandledRejection', observeUnhandled);
try {
  // An unexpected synchronous clone failure remains cache-side-only: no open,
  // no put, and no rejection or gating of the original response.
  let openAfterCloneFailure = 0;
  const cloneFailure = handoffSensitiveResponse('client still succeeds');
  cloneFailure.clone = () => {
    throw new TypeError('clone unexpectedly failed');
  };
  context.caches.open = async () => {
    openAfterCloneFailure++;
    throw new Error('must not open after clone failure');
  };
  context.fetch = async () => cloneFailure;
  const cloneFailureResult = await dispatch(canonicalRequest());
  assert.equal(cloneFailureResult.response, cloneFailure);
  assert.equal(
    cloneFailureResult.event.waitUntilPromises.length,
    0,
    'a synchronous clone failure does not create a cache lifetime',
  );
  assert.equal(
    openAfterCloneFailure,
    0,
    'clone failure does not start cache open',
  );

  // Open and put failures are caught by the accepted cache lifetime and never
  // surface to the client or process as unhandled rejections.
  context.caches.open = async () => {
    throw new Error('cache open failure');
  };
  context.fetch = async () =>
    new Response('open still nonfatal', { status: 200 });
  const openFailure = await dispatch(canonicalRequest());
  assert.equal(await openFailure.response.text(), 'open still nonfatal');
  await openFailure.event.waitUntilPromises[0];

  context.caches.open = async () => ({
    async match() {
      return undefined;
    },
    async put() {
      throw new Error('cache quota failure');
    },
  });
  context.fetch = async () =>
    new Response('put still nonfatal', { status: 200 });
  const putFailure = await dispatch(canonicalRequest());
  assert.equal(await putFailure.response.text(), 'put still nonfatal');
  await putFailure.event.waitUntilPromises[0];
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(
    unhandledRejections,
    [],
    'cache failures are rejection-safe',
  );
} finally {
  process.off('unhandledRejection', observeUnhandled);
}

console.log(
  'PASS lazy cache lifecycle, prompt delivery, and strict negative cache cases',
);
