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

  const compress = await readFile(
    new URL('src/client/lazy-app/Compress/index.tsx', root),
    'utf8',
  );
  const output = await readFile(
    new URL('src/client/lazy-app/Compress/Output/index.tsx', root),
    'utf8',
  );
  const helperSource = await readFile(
    new URL('src/client/lazy-app/Compress/main-job.ts', root),
    'utf8',
  );
  const compiled = ts.transpileModule(helperSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  const abortable = (signal, promise) =>
    new Promise((resolve, reject) => {
      const onAbort = () =>
        reject(new DOMException('AbortError', 'AbortError'));
      signal.addEventListener('abort', onAbort, { once: true });
      Promise.resolve(promise)
        .then(resolve, reject)
        .finally(() => signal.removeEventListener('abort', onAbort));
    });
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    exports: module.exports,
    module,
    require(specifier) {
      if (specifier === '../util') {
        return {
          abortable,
          assertSignal(signal) {
            if (signal.aborted)
              throw new DOMException('AbortError', 'AbortError');
          },
          sniffMimeType: async (file) => file.type,
        };
      }
      throw new Error(`Unexpected main-job import: ${specifier}`);
    },
    AbortController,
    AbortSignal,
    DOMException,
    Error,
    Promise,
  });
  const {
    ben2RetryPreprocessorState,
    ben2TerminalStatePatch,
    errorName,
    mainJobSchedulingDecision,
    mainJobWorkNeeded,
    preprocessImage,
    runPreprocessingJob,
  } = module.exports;

  assert.equal(errorName(null), undefined);
  assert.equal(errorName('AbortError'), undefined);
  assert.equal(errorName({}), undefined);
  assert.equal(errorName({ name: 'AbortError' }), 'AbortError');

  const decoded = { id: 'browser-decoded', width: 4, height: 3 };
  const straightPng = { id: 'straight-png', width: 4, height: 3 };
  const matte = { id: 'matte', width: 4, height: 3 };
  const file = { name: 'alpha.png', type: 'image/png' };
  const disabled = { rotate: { rotate: 0 }, ben2: { enabled: false } };
  const enabled = { rotate: { rotate: 0 }, ben2: { enabled: true } };
  const signal = new AbortController().signal;

  // A PNG initially loaded through the ordinary disabled path must be routed
  // through straight-RGB PNG decode before BEN2 when the same File is enabled.
  const enableWork = mainJobWorkNeeded(
    { file, preprocessorState: disabled },
    { file, preprocessorState: enabled },
  );
  assert.deepEqual(JSON.parse(JSON.stringify(enableWork)), {
    decoding: false,
    preprocessing: true,
  });
  const enableCalls = [];
  const enableResult = await preprocessImage(signal, decoded, file, enabled, {
    async pngDecode(_signal, input) {
      enableCalls.push(['pngDecode', input]);
      return straightPng;
    },
    async rotate() {
      assert.fail('zero rotation must not run');
    },
    async ben2(_signal, input) {
      enableCalls.push(['ben2', input]);
      return matte;
    },
  });
  assert.equal(enableResult, matte);
  assert.deepEqual(enableCalls, [
    ['pngDecode', file],
    ['ben2', straightPng],
  ]);

  // Disabling is a new preprocessing job and restores the decoded identity.
  assert.equal(
    mainJobWorkNeeded(
      { file, preprocessorState: enabled },
      { file, preprocessorState: disabled },
    ).preprocessing,
    true,
  );
  const disableCalls = [];
  assert.equal(
    await preprocessImage(signal, decoded, file, disabled, {
      async pngDecode() {
        disableCalls.push('pngDecode');
      },
      async rotate() {
        disableCalls.push('rotate');
      },
      async ben2() {
        disableCalls.push('ben2');
      },
    }),
    decoded,
  );
  assert.deepEqual(disableCalls, []);

  const pngAssetWorker = {
    async pngDecode() {
      const error = new Error('chunk missing');
      error.name = 'PngModuleLoadError';
      throw error;
    },
    async rotate() {
      assert.fail('PNG asset failure stops preprocessing');
    },
    async ben2() {
      assert.fail('PNG asset failure stops preprocessing');
    },
  };
  await assert.rejects(
    preprocessImage(signal, decoded, file, enabled, pngAssetWorker),
    (error) => error?.name === 'Ben2TerminalError',
    'BEN2-path PNG asset failures enter explicit terminal Retry policy',
  );
  const corruptPngWorker = {
    ...pngAssetWorker,
    async pngDecode() {
      throw new Error('corrupt PNG');
    },
  };
  await assert.rejects(
    preprocessImage(signal, decoded, file, enabled, corruptPngWorker),
    (error) => error?.name === 'Error' && error?.message === 'corrupt PNG',
    'ordinary PNG decode errors do not become BEN2 terminal failures',
  );

  // A terminal call is allowed to settle before reset. Its state patch only
  // changes lifecycle fields, preserving the last completed source and output.
  let rejectRun;
  const events = [];
  const oldSource = { id: 'completed-source' };
  const oldSides = [
    {
      loading: true,
      data: { id: 'left' },
      file: { id: 'left-file' },
      downloadUrl: 'blob:left',
    },
    {
      loading: true,
      data: { id: 'right' },
      file: { id: 'right-file' },
      downloadUrl: 'blob:right',
    },
  ];
  let state = { source: oldSource, sides: oldSides, loading: true };
  const completedJob = { file, preprocessorState: disabled };
  const failedJob = { file, preprocessorState: enabled };
  const scheduler = {
    active: failedJob,
    terminal: undefined,
    completed: completedJob,
  };
  const terminalRun = runPreprocessingJob({
    signal,
    ben2Enabled: true,
    run: () =>
      new Promise((_, reject) => {
        events.push('call-started');
        rejectRun = reject;
      }),
    isCurrent: () => true,
    async reset() {
      events.push('reset');
    },
    publish() {
      assert.fail('terminal work must not publish');
    },
    publishTerminal() {
      events.push('terminal');
      scheduler.terminal = scheduler.active;
      scheduler.active = undefined;
      state = { ...state, ...ben2TerminalStatePatch(state.sides) };
    },
  });
  await Promise.resolve();
  assert.deepEqual(events, ['call-started']);
  const terminalError = new Error('asset missing');
  terminalError.name = 'Ben2TerminalError';
  rejectRun(terminalError);
  assert.equal(await terminalRun, 'terminal');
  assert.deepEqual(events, ['call-started', 'reset', 'terminal']);
  assert.equal(state.source, oldSource);
  assert.equal(state.sides[0].data, oldSides[0].data);
  assert.equal(state.sides[0].file, oldSides[0].file);
  assert.equal(state.sides[1].data, oldSides[1].data);
  assert.equal(state.sides[0].downloadUrl, 'blob:left');
  assert.equal(state.sides[1].downloadUrl, 'blob:right');
  assert.equal(state.loading, false);
  assert.equal(state.sides[0].loading, false);

  // Execute the production main-job scheduling decision around the terminal
  // publication transition. Ordinary component updates must stay quiescent;
  // Retry changes request identity once and therefore creates one fresh job.
  let requestedJob = failedJob;
  let requests = 1;
  let workers = 1;
  const scheduleProductionPass = () => {
    const decision = mainJobSchedulingDecision(scheduler, requestedJob);
    if (decision.quiescent) return decision;
    if (decision.decoding || decision.preprocessing) {
      requests++;
      workers++;
      scheduler.active = requestedJob;
      scheduler.terminal = undefined;
    }
    return decision;
  };

  assert.equal(scheduleProductionPass().quiescent, true);
  assert.equal(scheduleProductionPass().quiescent, true);
  assert.equal(requests, 1, 'terminal publication schedules no implicit request');
  assert.equal(workers, 1, 'terminal publication creates no implicit worker');

  requestedJob = {
    file,
    preprocessorState: ben2RetryPreprocessorState(enabled),
  };
  assert.equal(scheduleProductionPass().preprocessing, true);
  assert.equal(scheduleProductionPass().preprocessing, false);
  assert.equal(requests, 2, 'one Retry schedules exactly one fresh request');
  assert.equal(workers, 2, 'one Retry creates exactly one fresh worker');

  scheduler.terminal = scheduler.active;
  scheduler.active = undefined;
  assert.equal(scheduleProductionPass().quiescent, true);

  const beforeChange = requests;
  requestedJob = {
    file,
    preprocessorState: {
      rotate: { rotate: 90 },
      ben2: { enabled: true },
    },
  };
  assert.equal(scheduleProductionPass().preprocessing, true);
  assert.equal(
    requests,
    beforeChange + 1,
    'changing preprocessor state after failure schedules new-state work',
  );

  scheduler.terminal = scheduler.active;
  scheduler.active = undefined;
  const beforeDisable = requests;
  requestedJob = { file, preprocessorState: disabled };
  assert.equal(scheduleProductionPass().preprocessing, true);
  assert.equal(
    requests,
    beforeDisable + 1,
    'disabling after a terminal failure schedules normal identity work',
  );

  // Once superseded, stale success and failure jobs cannot publish or clear
  // the newer active job.
  let currentJob = 'old';
  let resolveOld;
  const stalePublications = [];
  const oldRun = runPreprocessingJob({
    signal,
    ben2Enabled: true,
    run: () => new Promise((resolve) => (resolveOld = resolve)),
    isCurrent: () => currentJob === 'old',
    async reset() {},
    publish() {
      stalePublications.push('old');
      currentJob = undefined;
    },
    publishTerminal() {
      stalePublications.push('old-terminal');
      currentJob = undefined;
    },
  });
  currentJob = 'new';
  const newRun = runPreprocessingJob({
    signal,
    ben2Enabled: true,
    run: async () => matte,
    isCurrent: () => currentJob === 'new',
    async reset() {},
    publish() {
      stalePublications.push('new');
    },
    publishTerminal() {
      assert.fail('new job must succeed');
    },
  });
  assert.equal(await newRun, 'published');
  resolveOld(straightPng);
  assert.equal(await oldRun, 'stale');
  assert.deepEqual(stalePublications, ['new']);
  assert.equal(currentJob, 'new', 'stale work cannot clear newer active work');

  const staleTerminalError = new Error('old failed');
  staleTerminalError.name = 'Ben2TerminalError';
  assert.equal(
    await runPreprocessingJob({
      signal,
      ben2Enabled: true,
      run: async () => {
        throw staleTerminalError;
      },
      isCurrent: () => false,
      async reset() {},
      publish() {
        assert.fail('stale failure must not publish');
      },
      publishTerminal() {
        currentJob = undefined;
      },
    }),
    'stale',
  );
  assert.equal(currentJob, 'new', 'stale failure cannot clear newer work');

  // Cache status is advisory: publication and job settlement happen before a
  // nonresponsive refresh, and a rejected refresh is consumed.
  let published = false;
  assert.equal(
    await runPreprocessingJob({
      signal,
      ben2Enabled: true,
      run: async () => matte,
      isCurrent: () => true,
      async reset() {},
      publish() {
        published = true;
      },
      publishTerminal() {},
      refreshCacheStatus: () => new Promise(() => {}),
    }),
    'published',
  );
  assert.equal(published, true);
  await runPreprocessingJob({
    signal,
    ben2Enabled: true,
    run: async () => matte,
    isCurrent: () => true,
    async reset() {},
    publish() {},
    publishTerminal() {},
    refreshCacheStatus: async () => {
      throw new Error('cache status rejected');
    },
  });
  await Promise.resolve();

  // Keep source-stripping and product-copy checks separate from behavioral
  // lifecycle assertions.
  const all = `${compress}\n${output}`;
  assert.doesNotMatch(
    all,
    /searchParams|ben2SpikeEnabled|__squooshBen2|cancellation-audit|ben2CancellationAudit|auditJobId/i,
  );
  assert.match(compress, /onBen2Retry/);
  assert.match(output, /Remove background \(BEN2\)/);
  assert.equal(
    (output.match(/Remove background \(BEN2\)/g) || []).length,
    1,
    'the shared BEN2 control must be rendered once',
  );
  assert.match(output, /208\.971 MiB/);
  assert.match(output, /Original Image/);
  assert.match(output, /JPEG/);
  assert.match(output, /OxiPNG/);
  assert.match(output, /Browser PNG/);
  assert.match(output, /Retry/);

  console.log('BEN2 client lifecycle assertion passed');
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

  const filename = new URL(
    'src/features/preprocessors/ben2/worker/ben2.ts',
    root,
  );
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
