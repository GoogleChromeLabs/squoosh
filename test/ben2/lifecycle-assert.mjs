import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const mode = process.argv[2];
assert.ok(
  ['--bridge', '--client', '--worker'].includes(mode),
  'usage: lifecycle-assert.mjs --bridge|--client|--worker',
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
  const compress = await readFile(
    new URL('src/client/lazy-app/Compress/index.tsx', root),
    'utf8',
  );
  const output = await readFile(
    new URL('src/client/lazy-app/Compress/Output/index.tsx', root),
    'utf8',
  );
  const all = `${compress}\n${output}`;

  assert.doesNotMatch(
    all,
    /searchParams|ben2SpikeEnabled|__squooshBen2|cancellation-audit|ben2CancellationAudit|auditJobId/i,
  );
  assert.match(compress, /workerBridge\.pngDecode\(signal,\s*sourceFile\)/s);
  assert.match(compress, /await workerBridge\.ben2\(signal,/);
  assert.ok(
    compress.indexOf('workerBridge.pngDecode') <
      compress.indexOf('workerBridge.ben2'),
    'PNG decode must precede BEN2',
  );
  assert.match(compress, /errorName\(err\) === 'Ben2TerminalError'/);
  assert.doesNotMatch(
    compress,
    /err instanceof Error && err\.name === 'Ben2TerminalError'/,
  );
  assert.match(compress, /await this\.workerBridges\[0\]\.reset\(\)/);
  assert.match(compress, /activeMainJob = undefined/);
  assert.match(compress, /activeSideJobs = \[undefined, undefined\]/);
  assert.match(compress, /onBen2Retry/);
  assert.match(
    compress,
    /ben2:\s*{\s*\.\.\.state\.preprocessorState\.ben2\s*}/s,
  );
  assert.match(compress, /const status = await ben2CacheStatus\(\)/);
  assert.doesNotMatch(compress, /ben2CacheStatus as unknown/);
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

  const staleGuards =
    compress.match(/if \([^)]*[Ss]ignal\.aborted\) return \{\};/g) || [];
  assert.ok(
    staleGuards.length >= 4,
    'stale-publication signal guards must remain',
  );

  console.log('BEN2 client lifecycle assertion passed');
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
if (mode === '--client') await clientAssertions();
if (mode === '--worker') await workerAssertions();
