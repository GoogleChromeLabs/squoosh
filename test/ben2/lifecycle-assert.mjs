import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const mode = process.argv[2];
assert.ok(
  ['--bridge', '--cache', '--client', '--worker'].includes(mode),
  'usage: lifecycle-assert.mjs --bridge|--cache|--client|--worker',
);

const root = new URL('../../', import.meta.url);

async function bridgeAssertions() {
  const require = createRequire(import.meta.url);
  let ts;
  try {
    ts = require('typescript');
  } catch {
    throw new Error(
      'lifecycle --bridge requires the repository TypeScript dependency',
    );
  }

  const filename = new URL('src/client/lazy-app/worker-bridge/index.ts', root);
  const source = await readFile(filename, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  const timers = new Map();
  let nextTimer = 0;
  const workers = [];
  let nextCall;

  class FakeWorker {
    constructor(url) {
      this.url = url;
      this.terminated = false;
      this.api = {
        ben2: () => nextCall(),
      };
      workers.push(this);
    }
    terminate() {
      this.terminated = true;
    }
  }

  const abortable = (signal, promise) =>
    new Promise((resolve, reject) => {
      const onAbort = () =>
        reject(new DOMException('AbortError', 'AbortError'));
      signal.addEventListener('abort', onAbort, { once: true });
      Promise.resolve(promise)
        .then(resolve, reject)
        .finally(() => {
          signal.removeEventListener('abort', onAbort);
        });
    });

  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    exports: module.exports,
    module,
    require(specifier) {
      if (specifier === 'comlink') return { wrap: (worker) => worker.api };
      if (specifier === './meta') return { methodNames: ['ben2'] };
      if (specifier.startsWith('omt:')) return 'worker.js';
      if (specifier === '../util') return { abortable };
      throw new Error(`Unexpected bridge import: ${specifier}`);
    },
    Worker: FakeWorker,
    AbortController,
    AbortSignal,
    DOMException,
    Promise,
    clearTimeout(id) {
      timers.delete(id);
    },
    setTimeout(callback, delay) {
      assert.equal(delay, 10_000);
      const id = ++nextTimer;
      timers.set(id, callback);
      return id;
    },
  });
  const WorkerBridge = module.exports.default;

  const bridge = new WorkerBridge();
  nextCall = async () => 'ok';
  assert.equal(await bridge.ben2(new AbortController().signal), 'ok');
  assert.equal(await bridge.ben2(new AbortController().signal), 'ok');
  assert.equal(workers.length, 1, 'settled calls should reuse one worker');

  for (const callback of [...timers.values()]) callback();
  timers.clear();
  assert.equal(workers[0].terminated, true, 'idle worker should terminate');
  await bridge.ben2(new AbortController().signal);
  assert.equal(workers.length, 2, 'call after idle should create a worker');

  let settleActive;
  nextCall = () =>
    new Promise((resolve) => {
      settleActive = resolve;
    });
  const active = bridge.ben2(new AbortController().signal);
  await Promise.resolve();
  await Promise.resolve();
  const reset = bridge.reset();
  await Promise.resolve();
  assert.equal(
    workers[1].terminated,
    false,
    'reset must queue behind active work',
  );
  settleActive('done');
  assert.equal(await active, 'done');
  await reset;
  assert.equal(
    workers[1].terminated,
    true,
    'queued reset should terminate worker',
  );

  nextCall = async () => 'fresh';
  assert.equal(await bridge.ben2(new AbortController().signal), 'fresh');
  assert.equal(workers.length, 3, 'call after reset should create a worker');

  let neverResolve;
  nextCall = () =>
    new Promise((resolve) => {
      neverResolve = resolve;
    });
  const controller = new AbortController();
  const aborted = bridge.ben2(controller.signal);
  await Promise.resolve();
  await Promise.resolve();
  controller.abort();
  await assert.rejects(aborted, (error) => error?.name === 'AbortError');
  assert.equal(
    workers[2].terminated,
    true,
    'abort should terminate active worker',
  );
  neverResolve?.();

  assert.doesNotMatch(source, /audit|bridgeId|workerId|counter/i);
  console.log('BEN2 bridge lifecycle assertion passed');
}

async function clientAssertions() {
  const require = createRequire(import.meta.url);
  let ts;
  try {
    ts = require('typescript');
  } catch {
    throw new Error(
      'lifecycle --client requires the repository TypeScript dependency',
    );
  }

  const mainJobPath = new URL('src/client/lazy-app/Compress/main-job.ts', root);
  const mainJobSource = await readFile(mainJobPath, 'utf8');
  const mainJobCompiled = ts.transpileModule(mainJobSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const mainJobModule = { exports: {} };
  vm.runInNewContext(mainJobCompiled, {
    exports: mainJobModule.exports,
    module: mainJobModule,
    require(specifier) {
      if (specifier === '../util') {
        return {
          assertSignal(signal) {
            if (signal.aborted) {
              throw new DOMException('AbortError', 'AbortError');
            }
          },
        };
      }
      throw new Error(`Unexpected main-job import: ${specifier}`);
    },
    DOMException,
    Error,
    Promise,
  });

  const { preprocessImage } = mainJobModule.exports;
  const calls = [];
  const decoded = { id: 'decoded', width: 4, height: 3 };
  const rotated = { id: 'rotated', width: 3, height: 4 };
  const file = { name: 'input.png', type: 'image/png' };

  // Rotate is the whole global preprocessing contract. Passing the generated
  // Rotate-only state through the real main helper must neither require BEN2
  // state nor request PNG/BEN2 work.
  assert.equal(
    await preprocessImage(
      new AbortController().signal,
      decoded,
      { rotate: { rotate: 90 } },
      {
        async pngDecode() {
          calls.push('pngDecode');
          assert.fail('main preprocessing must not decode PNG for BEN2');
        },
        async rotate(_signal, image, options) {
          calls.push(['rotate', image, options]);
          return rotated;
        },
        async ben2() {
          calls.push('ben2');
          assert.fail('main preprocessing must not invoke BEN2');
        },
      },
    ),
    rotated,
  );
  assert.deepEqual(calls, [['rotate', decoded, { rotate: 90 }]]);

  const processorMetaPath = new URL(
    'src/features/processors/ben2/shared/meta.ts',
    root,
  );
  const processorMeta = await readFile(processorMetaPath, 'utf8');
  assert.match(processorMeta, /Options\s*=\s*Record<never, never>/);
  assert.match(processorMeta, /defaultOptions\s*=\s*\{\}/);
  await assert.rejects(
    readFile(
      new URL('src/features/preprocessors/ben2/shared/meta.ts', root),
      'utf8',
    ),
    { code: 'ENOENT' },
    'BEN2 must be discovered only as a processor, never as a preprocessor',
  );

  // The remaining assertions deliberately load the production per-side helper
  // rather than reproducing its scheduler in this test. Its small public
  // contract is the seam used by Compress for persistence, shared work, and
  // per-consumer cancellation/Retry behavior.
  const helperPath = new URL(
    'src/client/lazy-app/Compress/ben2-processing.ts',
    root,
  );
  const helperSource = await readFile(helperPath, 'utf8');
  const helperCompiled = ts.transpileModule(helperSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  const helperModule = { exports: {} };
  vm.runInNewContext(helperCompiled, {
    exports: helperModule.exports,
    module: helperModule,
    require(specifier) {
      if (specifier === '../util') {
        return {
          abortable(signal, promise) {
            return new Promise((resolve, reject) => {
              const abort = () =>
                reject(new DOMException('AbortError', 'AbortError'));
              signal.addEventListener('abort', abort, { once: true });
              Promise.resolve(promise)
                .then(resolve, reject)
                .finally(() => signal.removeEventListener('abort', abort));
            });
          },
          sniffMimeType: async (input) => input.type,
        };
      }
      throw new Error(`Unexpected BEN2 helper import: ${specifier}`);
    },
    AbortController,
    AbortSignal,
    DOMException,
    Error,
    Promise,
    Set,
  });
  const {
    createBen2Coordinator,
    normaliseBen2SideSettings,
    ben2RetryProcessorState,
    ben2WorkNeeded,
    ben2ResizeSource,
    ben2ResizeOptions,
  } = helperModule.exports;
  for (const [name, value] of Object.entries({
    createBen2Coordinator,
    normaliseBen2SideSettings,
    ben2RetryProcessorState,
    ben2WorkNeeded,
    ben2ResizeSource,
    ben2ResizeOptions,
  })) {
    assert.equal(typeof value, 'function', `BEN2 helper exports ${name}`);
  }

  const defaults = {
    resize: { enabled: false, method: 'lanczos3' },
    quantize: { enabled: false },
    ben2: { enabled: false },
  };
  const oldSettings = normaliseBen2SideSettings(
    {
      latestSettings: { processorState: { resize: { enabled: true } } },
      encodedSettings: { processorState: { quantize: { enabled: true } } },
    },
    defaults,
  );
  assert.equal(oldSettings.latestSettings.processorState.ben2.enabled, false);
  assert.equal(oldSettings.encodedSettings.processorState.ben2.enabled, false);
  const rawIntent = normaliseBen2SideSettings(
    {
      latestSettings: { processorState: { ben2: { enabled: true } } },
      encodedSettings: { processorState: { ben2: { enabled: true } } },
    },
    defaults,
  );
  assert.equal(rawIntent.latestSettings.processorState.ben2.enabled, true);
  assert.equal(rawIntent.encodedSettings.processorState.ben2.enabled, true);

  const leftProcessorState = {
    ...defaults,
    ben2: { enabled: true },
  };
  const rightProcessorState = { ...defaults, ben2: { enabled: false } };
  const retryState = ben2RetryProcessorState(leftProcessorState);
  assert.notEqual(retryState, leftProcessorState);
  assert.notEqual(retryState.ben2, leftProcessorState.ben2);
  assert.equal(rightProcessorState.ben2.enabled, false);
  assert.equal(
    ben2WorkNeeded({
      processorState: leftProcessorState,
      encoderState: undefined,
      capability: { state: 'supported' },
    }),
    false,
    'Original Image retains raw intent but never starts BEN2 work',
  );
  assert.equal(
    ben2WorkNeeded({
      processorState: leftProcessorState,
      encoderState: { type: 'mozJPEG' },
      capability: { state: 'unsupported' },
    }),
    false,
    'unsupported capability never starts BEN2 work',
  );

  let release;
  let pngCalls = 0;
  let rotateCalls = 0;
  let ben2Calls = 0;
  let resets = 0;
  const matte = { id: 'shared-matte', width: 3, height: 4 };
  const bridge = {
    async pngDecode() {
      pngCalls++;
      return decoded;
    },
    async rotate(_signal, input) {
      rotateCalls++;
      assert.equal(input, decoded);
      return rotated;
    },
    ben2() {
      ben2Calls++;
      return new Promise((resolve) => (release = () => resolve(matte)));
    },
    async reset() {
      resets++;
    },
  };
  const coordinator = createBen2Coordinator(bridge);
  const leftAbort = new AbortController();
  const rightAbort = new AbortController();
  const commonSource = { file, decoded, preprocessed: rotated };
  const left = coordinator.acquire(
    commonSource,
    { rotate: 90 },
    leftAbort.signal,
  );
  const right = coordinator.acquire(
    commonSource,
    { rotate: 90 },
    rightAbort.signal,
  );
  for (let tick = 0; tick < 12 && ben2Calls === 0; tick++) {
    await Promise.resolve();
  }
  assert.deepEqual(
    [pngCalls, rotateCalls, ben2Calls],
    [1, 1, 1],
    'two encoded sides share PNG decode, Rotate, and BEN2 for one source',
  );
  leftAbort.abort();
  await assert.rejects(left, (error) => error?.name === 'AbortError');
  assert.equal(resets, 0, 'one consumer cancellation keeps shared work alive');
  release();
  assert.equal(await right, matte, 'the surviving side receives shared raster');

  let abandonedResets = 0;
  const abandonedCoordinator = createBen2Coordinator({
    async pngDecode() {
      return decoded;
    },
    async rotate() {
      return rotated;
    },
    ben2() {
      return new Promise(() => {});
    },
    async reset() {
      abandonedResets++;
    },
  });
  const abandonedLeft = new AbortController();
  const abandonedRight = new AbortController();
  const abandonedLeftWork = abandonedCoordinator.acquire(
    commonSource,
    { rotate: 90 },
    abandonedLeft.signal,
  );
  const abandonedRightWork = abandonedCoordinator.acquire(
    commonSource,
    { rotate: 90 },
    abandonedRight.signal,
  );
  abandonedLeft.abort();
  await assert.rejects(
    abandonedLeftWork,
    (error) => error?.name === 'AbortError',
  );
  assert.equal(abandonedResets, 0, 'one active consumer keeps work alive');
  abandonedRight.abort();
  await assert.rejects(
    abandonedRightWork,
    (error) => error?.name === 'AbortError',
  );
  assert.equal(
    abandonedResets,
    1,
    'last consumer cancellation resets shared work',
  );

  const rasterSource = ben2ResizeSource(
    { ...commonSource, vectorImage: { id: 'svg' } },
    matte,
  );
  assert.equal(rasterSource.preprocessed, matte);
  assert.equal(rasterSource.vectorImage?.id, 'svg');
  assert.equal(
    ben2ResizeOptions({ enabled: true, method: 'vector' }, true).method,
    'lanczos3',
    'effective BEN2 disables SVG vector bypass only for that side',
  );
  assert.equal(
    ben2ResizeOptions({ enabled: true, method: 'vector' }, false).method,
    'vector',
  );

  // A terminal coordinator record is latched until explicit Retry. It cannot
  // create a request during ordinary rerenders, and one Retry creates one new
  // shared request without changing the other side's raw intent.
  let attempts = 0;
  const terminalBridge = {
    async pngDecode() {
      return decoded;
    },
    async rotate() {
      return rotated;
    },
    async ben2() {
      attempts++;
      if (attempts === 1) {
        const error = new Error('asset missing');
        error.name = 'Ben2TerminalError';
        throw error;
      }
      return matte;
    },
    async reset() {},
  };
  const terminalCoordinator = createBen2Coordinator(terminalBridge);
  const terminalSignal = new AbortController().signal;
  await assert.rejects(
    terminalCoordinator.acquire(commonSource, { rotate: 90 }, terminalSignal),
    (error) => error?.name === 'Ben2TerminalError',
  );
  await assert.rejects(
    terminalCoordinator.acquire(commonSource, { rotate: 90 }, terminalSignal),
    (error) => error?.name === 'Ben2TerminalError',
  );
  assert.equal(attempts, 1, 'terminal state never implicitly retries');
  terminalCoordinator.retry(commonSource);
  assert.equal(
    await terminalCoordinator.acquire(
      commonSource,
      { rotate: 90 },
      terminalSignal,
    ),
    matte,
  );
  assert.equal(attempts, 2, 'one explicit Retry starts exactly one fresh call');

  const compress = await readFile(
    new URL('src/client/lazy-app/Compress/index.tsx', root),
    'utf8',
  );
  const options = await readFile(
    new URL('src/client/lazy-app/Compress/Options/index.tsx', root),
    'utf8',
  );
  const output = await readFile(
    new URL('src/client/lazy-app/Compress/Output/index.tsx', root),
    'utf8',
  );
  const outputCss = await readFile(
    new URL('src/client/lazy-app/Compress/Output/style.css', root),
    'utf8',
  );
  assert.match(compress, /processorState\.ben2\.enabled/);
  assert.doesNotMatch(compress, /preprocessorState\.ben2/);
  assert.match(compress, /terminalSideJobs/);
  assert.match(compress, /ben2TerminalErrors/);
  assert.match(compress, /normaliseBen2SideSettings/);
  assert.match(compress, /ben2Capability={ben2Capability}/);
  assert.match(compress, /ben2CacheState={ben2CacheState}/);
  assert.match(compress, /ben2FirstUse={!ben2HasCompleted}/);
  assert.match(compress, /ben2Processing={side\.loading}/);
  assert.match(compress, /onBen2Retry/);
  assert.match(options, /Remove background \(BEN2\)/);
  assert.match(options, /name="ben2\.enable"/);
  assert.match(options, /onChange={this\.onProcessorEnabledChange}/);
  assert.doesNotMatch(output, /BEN2|ben2[A-Z]|ben2-/);
  assert.doesNotMatch(outputCss, /\.ben2-/);
  assert.match(outputCss, /overflow:\s*hidden/);
  assert.match(outputCss, /contain:\s*content/);

  console.log('BEN2 per-side client lifecycle assertion passed');
}

async function cacheAssertions() {
  const require = createRequire(import.meta.url);
  let ts;
  try {
    ts = require('typescript');
  } catch {
    throw new Error(
      'lifecycle --cache requires the repository TypeScript dependency',
    );
  }

  const bridgeSource = await readFile(
    new URL('src/client/lazy-app/sw-bridge/index.ts', root),
    'utf8',
  );
  const bridgeCompiled = ts.transpileModule(bridgeSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  class FakePort {
    constructor() {
      this.onmessage = null;
      this.onmessageerror = null;
      this.closed = false;
      this.peer = undefined;
    }
    postMessage(data) {
      this.peer?.onmessage?.({ data });
    }
    close() {
      this.closed = true;
    }
  }
  const channels = [];
  class FakeMessageChannel {
    constructor() {
      this.port1 = new FakePort();
      this.port2 = new FakePort();
      this.port1.peer = this.port2;
      this.port2.peer = this.port1;
      channels.push(this);
    }
  }
  const timers = new Map();
  let nextTimer = 0;
  const listeners = new Set();
  const serviceWorker = {
    controller: undefined,
    addEventListener(type, listener) {
      if (type === 'controllerchange') listeners.add(listener);
    },
    removeEventListener(type, listener) {
      if (type === 'controllerchange') listeners.delete(listener);
    },
  };
  const bridgeModule = { exports: {} };
  vm.runInNewContext(bridgeCompiled, {
    exports: bridgeModule.exports,
    module: bridgeModule,
    require(specifier) {
      if (specifier === 'idb-keyval') {
        return { get: async () => undefined, set: async () => undefined };
      }
      if (specifier === 'service-worker:sw') return 'sw.js';
      throw new Error(`Unexpected SW bridge import: ${specifier}`);
    },
    navigator: { serviceWorker },
    location: { reload() {} },
    MessageChannel: FakeMessageChannel,
    Promise,
    Array,
    clearTimeout(id) {
      timers.delete(id);
    },
    setTimeout(callback, delay) {
      assert.ok(delay > 0 && delay <= 5_000, 'status timeout must be bounded');
      const id = ++nextTimer;
      timers.set(id, callback);
      return id;
    },
  });
  const { ben2CacheStatus } = bridgeModule.exports;
  const fallback = { controlled: false, entries: [], offlineReady: false };

  assert.deepEqual(
    JSON.parse(JSON.stringify(await ben2CacheStatus())),
    fallback,
  );

  serviceWorker.controller = { postMessage() {} };
  const timeoutStatus = ben2CacheStatus();
  assert.equal(timers.size, 1);
  for (const callback of [...timers.values()]) callback();
  assert.deepEqual(JSON.parse(JSON.stringify(await timeoutStatus)), fallback);
  assert.equal(channels.at(-1).port1.closed, true);
  assert.equal(listeners.size, 0, 'timeout cleans controller listener');
  assert.equal(timers.size, 0, 'timeout cleans timer');

  serviceWorker.controller = {
    postMessage(_message, ports) {
      ports[0].postMessage({ ok: false, error: 'cache lookup failed' });
    },
  };
  assert.deepEqual(
    JSON.parse(JSON.stringify(await ben2CacheStatus())),
    fallback,
  );

  serviceWorker.controller = {
    postMessage(_message, ports) {
      ports[0].peer.onmessageerror();
    },
  };
  assert.deepEqual(
    JSON.parse(JSON.stringify(await ben2CacheStatus())),
    fallback,
  );

  serviceWorker.controller = { postMessage() {} };
  const changedStatus = ben2CacheStatus();
  for (const listener of [...listeners]) listener();
  assert.deepEqual(JSON.parse(JSON.stringify(await changedStatus)), fallback);
  assert.equal(listeners.size, 0);

  serviceWorker.controller = {
    postMessage() {
      throw new Error('detached controller');
    },
  };
  assert.deepEqual(
    JSON.parse(JSON.stringify(await ben2CacheStatus())),
    fallback,
  );

  const entries = [
    'features_worker',
    'model',
    'ort_asyncify_mjs',
    'ort_asyncify_wasm',
    'png_decoder_js',
    'png_decoder_wasm',
  ].map((role) => ({ role, path: `/${role}`, cached: true }));
  serviceWorker.controller = {
    postMessage(_message, ports) {
      ports[0].postMessage({ ok: true, cacheName: 'static-v1', entries });
    },
  };
  const success = await ben2CacheStatus();
  assert.equal(success.controlled, true);
  assert.equal(success.offlineReady, true);
  assert.equal(success.entries.length, 6);
  assert.equal(listeners.size, 0);
  assert.equal(timers.size, 0);

  // Execute the production service-worker message handler and prove rejected
  // CacheStorage reads still produce an explicit response without opening (and
  // therefore without creating) a cache.
  const swSource = await readFile(new URL('src/sw/index.ts', root), 'utf8');
  const swCompiled = ts.transpileModule(swSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const swListeners = new Map();
  const inventory = entries.map(({ role, path }) => ({ role, path }));
  let opens = 0;
  const matchedUrls = [];
  const swContext = {
    exports: {},
    module: { exports: {} },
    require(specifier) {
      if (specifier === './util') {
        return {
          cacheBen2Asset() {},
          cacheOrNetworkAndCache() {},
          cleanupCache() {},
          cacheOrNetwork() {},
          cacheBasics: async () => {},
          cacheAdditionalProcessors: async () => {},
          serveShareTarget() {},
        };
      }
      if (specifier === 'idb-keyval') return { get: async () => false };
      if (specifier === './to-cache') {
        return {
          ben2AssetInventory: inventory,
          ben2Assets: [],
          shouldCacheDynamically: () => false,
        };
      }
      throw new Error(`Unexpected service worker import: ${specifier}`);
    },
    self: {
      clients: { claim() {} },
      addEventListener(type, listener) {
        swListeners.set(type, listener);
      },
      skipWaiting() {},
    },
    VERSION: 'v1',
    ASSETS: [],
    location: { origin: 'https://squoosh.test' },
    URL,
    Promise,
    caches: {
      async match(url) {
        matchedUrls.push(String(url));
        throw new Error('CacheStorage rejected');
      },
      async open() {
        opens++;
        throw new Error('must not open');
      },
      async keys() {
        return [];
      },
      async delete() {},
    },
  };
  swContext.exports = swContext.module.exports;
  vm.runInNewContext(swCompiled, swContext);
  const replies = [];
  const lifetimes = [];
  swListeners.get('message')({
    data: {
      action: 'ben2-cache-status',
      urls: ['https://attacker.test/not-owned'],
    },
    ports: [{ postMessage: (message) => replies.push(message) }],
    waitUntil(promise) {
      lifetimes.push(promise);
    },
  });
  await Promise.all(lifetimes);
  assert.equal(opens, 0, 'read-only status never opens or creates a cache');
  assert.equal(matchedUrls.length, 6);
  assert.ok(
    matchedUrls.every((url) => url.startsWith('https://squoosh.test/')),
    'status lookup derives canonical URLs only from owned inventory',
  );
  assert.ok(matchedUrls.every((url) => !url.includes('attacker.test')));
  assert.equal(replies.length, 1);
  assert.equal(replies[0].ok, false, 'cache rejection gets explicit fallback');

  console.log('BEN2 cache-status lifecycle assertion passed');
}

async function workerAssertions() {
  const require = createRequire(import.meta.url);
  let ts;
  try {
    ts = require('typescript');
  } catch {
    throw new Error(
      'lifecycle --worker requires the repository TypeScript dependency',
    );
  }

  const filename = new URL('src/features/processors/ben2/worker/ben2.ts', root);
  const source = await readFile(filename, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  function loadWorker({ create, gpu, runtimeDevice }) {
    const createCalls = [];
    const ort = {
      env: {
        wasm: {},
        webgpu: { device: Promise.resolve(runtimeDevice) },
      },
      InferenceSession: {
        async create(url, options) {
          createCalls.push({ url, options });
          return create();
        },
      },
      Tensor: class {
        constructor(type, data, dimensions) {
          Object.assign(this, { type, data, dimensions });
        }
      },
    };
    const module = { exports: {} };
    const context = {
      exports: module.exports,
      module,
      require(specifier) {
        if (specifier === 'onnxruntime-web/webgpu') return ort;
        if (specifier.startsWith('url:onnxruntime-web/')) return specifier;
        if (specifier.startsWith('url:../../../../../')) return 'model.onnx';
        if (specifier === '../shared/preprocessing') {
          return {
            makeNormalizedInput: () => new Float32Array(3 * 1024 * 1024),
            applyMatte: (image) => image,
          };
        }
        throw new Error(`Unexpected worker import: ${specifier}`);
      },
      navigator: { gpu },
      isSecureContext: true,
      location: { href: 'https://example.test/worker.js' },
      URL,
      Error,
      Promise,
      Float32Array,
      Uint8ClampedArray,
    };
    vm.runInNewContext(compiled, context);
    return {
      ben2: module.exports.default,
      createCalls,
    };
  }

  const image = {
    data: new Uint8ClampedArray([1, 2, 3, 255]),
    width: 1,
    height: 1,
  };
  const adapter = {
    features: new Set(['shader-f16']),
    async requestDevice(options) {
      assert.equal(
        JSON.stringify(options),
        JSON.stringify({ requiredFeatures: ['shader-f16'] }),
      );
      return { destroy() {} };
    },
  };
  const gpu = {
    async requestAdapter(options) {
      assert.equal(
        JSON.stringify(options),
        JSON.stringify({ forceFallbackAdapter: false }),
      );
      return adapter;
    },
  };

  {
    let runs = 0;
    const session = {
      async run() {
        runs++;
        return { alphas: { data: new Float32Array(1024 * 1024) } };
      },
      async release() {},
    };
    const worker = loadWorker({
      create: () => session,
      gpu,
      runtimeDevice: { lost: new Promise(() => {}) },
    });
    assert.equal(await worker.ben2(image), image);
    assert.equal(await worker.ben2(image), image);
    assert.equal(worker.createCalls.length, 1);
    assert.equal(runs, 2);
    assert.equal(
      JSON.stringify(worker.createCalls[0].options.executionProviders),
      JSON.stringify(['webgpu']),
    );
    assert.equal(
      worker.createCalls[0].options.graphOptimizationLevel,
      'disabled',
    );
  }

  {
    const worker = loadWorker({
      create: () => assert.fail('session creation must not run'),
      gpu: undefined,
      runtimeDevice: undefined,
    });
    await assert.rejects(
      worker.ben2(image),
      (error) => error?.name === 'Ben2CapabilityError',
    );
    assert.equal(worker.createCalls.length, 0);
  }

  {
    const worker = loadWorker({
      create: () => {
        throw new Error('network failed');
      },
      gpu,
      runtimeDevice: { lost: new Promise(() => {}) },
    });
    await assert.rejects(
      worker.ben2(image),
      (error) => error?.name === 'Ben2TerminalError',
    );
    await assert.rejects(
      worker.ben2(image),
      (error) => error?.name === 'Ben2TerminalError',
    );
    assert.equal(worker.createCalls.length, 1, 'creation must not auto-retry');
  }

  {
    let releases = 0;
    const session = {
      async run() {
        throw new Error('run failed');
      },
      async release() {
        releases++;
      },
    };
    const worker = loadWorker({
      create: () => session,
      gpu,
      runtimeDevice: { lost: new Promise(() => {}) },
    });
    await assert.rejects(
      worker.ben2(image),
      (error) => error?.name === 'Ben2TerminalError',
    );
    assert.equal(releases, 1);
  }

  {
    let loseDevice;
    let releases = 0;
    const lost = new Promise((resolve) => {
      loseDevice = resolve;
    });
    const session = {
      async run() {
        return { alphas: { data: new Float32Array(1024 * 1024) } };
      },
      async release() {
        releases++;
      },
    };
    const worker = loadWorker({
      create: () => session,
      gpu,
      runtimeDevice: { lost },
    });
    await worker.ben2(image);
    loseDevice({ reason: 'destroyed' });
    await Promise.resolve();
    await Promise.resolve();
    await assert.rejects(
      worker.ben2(image),
      (error) => error?.name === 'Ben2TerminalError',
    );
    assert.equal(releases, 1);
  }

  assert.doesNotMatch(
    source,
    /diagnostics|telemetry|sessionCreateCount|runCount/,
  );
  console.log('BEN2 worker lifecycle assertion passed');
}

if (mode === '--bridge') await bridgeAssertions();
if (mode === '--cache') await cacheAssertions();
if (mode === '--client') await clientAssertions();
if (mode === '--worker') await workerAssertions();
