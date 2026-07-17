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

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

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

  const { preprocessImage, runMainPreprocessingJob } = mainJobModule.exports;
  assert.equal(
    typeof runMainPreprocessingJob,
    'function',
    'main preprocessing exposes its production settlement seam',
  );
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

  for (const invalidation of ['supersession', 'unmount']) {
    const controller = new AbortController();
    let current = true;
    let publications = 0;
    let loadingMutations = 0;
    let snackbars = 0;
    const outcome = runMainPreprocessingJob({
      signal: controller.signal,
      run: () =>
        preprocessImage(
          controller.signal,
          decoded,
          { rotate: { rotate: 90 } },
          {
            rotate(signal) {
              return new Promise((_resolve, reject) => {
                signal.addEventListener(
                  'abort',
                  () => reject(new DOMException('AbortError', 'AbortError')),
                  { once: true },
                );
              });
            },
          },
        ),
      isCurrent: () => current,
      publish() {
        publications++;
      },
      fail() {
        loadingMutations++;
        snackbars++;
      },
    });
    await Promise.resolve();
    if (invalidation === 'supersession') current = false;
    controller.abort();
    assert.equal(await outcome, 'stale');
    assert.equal(publications, 0, `${invalidation} cannot publish output`);
    assert.equal(
      loadingMutations,
      0,
      `${invalidation} cannot clear loading for newer work`,
    );
    assert.equal(snackbars, 0, `${invalidation} cannot show a snackbar`);
  }

  let staleFailureCallbacks = 0;
  assert.equal(
    await runMainPreprocessingJob({
      signal: new AbortController().signal,
      run: async () => {
        throw new Error('obsolete rotate failed after supersession');
      },
      isCurrent: () => false,
      publish: () => staleFailureCallbacks++,
      fail: () => staleFailureCallbacks++,
    }),
    'stale',
    'a no-longer-current failure settles silently without rethrowing',
  );
  assert.equal(staleFailureCallbacks, 0);

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

  let resizeImplementation = () => {
    assert.fail('Resize should not run unless a routing test installs it');
  };
  const helperModule = { exports: {} };
  vm.runInNewContext(helperCompiled, {
    exports: helperModule.exports,
    module: helperModule,
    require(specifier) {
      if (specifier === 'features/processors/resize/client') {
        return { resize: (...args) => resizeImplementation(...args) };
      }
      if (specifier === '../util') {
        return {
          assertSignal(signal) {
            if (signal.aborted) {
              throw new DOMException('AbortError', 'AbortError');
            }
          },
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
    Ben2SideJobScheduler,
    Ben2TerminalToggleRetry,
    ben2OptionsDecision,
    ben2TerminalSideState,
    createBen2Coordinator,
    normaliseBen2SideSettings,
    ben2RetryProcessorState,
    processSideImage,
  } = helperModule.exports;
  for (const [name, value] of Object.entries({
    Ben2SideJobScheduler,
    Ben2TerminalToggleRetry,
    ben2OptionsDecision,
    ben2TerminalSideState,
    createBen2Coordinator,
    normaliseBen2SideSettings,
    ben2RetryProcessorState,
    processSideImage,
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
  const rightProcessorState = { ...defaults, ben2: { enabled: true } };
  const encoderState = { type: 'mozJPEG', options: {} };
  const encodedSettings = [
    { processorState: leftProcessorState, encoderState },
    { processorState: rightProcessorState, encoderState },
  ];
  const identitySettings = {
    processorState: leftProcessorState,
    encoderState: undefined,
  };
  const retryState = ben2RetryProcessorState(leftProcessorState);
  assert.notEqual(retryState, leftProcessorState);
  assert.notEqual(retryState.ben2, leftProcessorState.ben2);

  const gatingScheduler = new Ben2SideJobScheduler(defaults);
  for (const [label, capability, modelCached, settings] of [
    [
      'identity',
      { state: 'supported' },
      true,
      [identitySettings, identitySettings],
    ],
    ['checking', { state: 'checking' }, true, encodedSettings],
    ['unsupported', { state: 'unsupported' }, true, encodedSettings],
    ['model-absent', { state: 'supported' }, false, encodedSettings],
  ]) {
    const plan = gatingScheduler.plan(
      settings,
      [undefined, undefined],
      capability,
      modelCached,
      false,
    );
    assert.ok(
      plan.jobs.every((job) => !job.processorState.ben2.enabled),
      `${label} schedules no effective BEN2 work`,
    );
    for (const job of plan.jobs) {
      assert.equal(
        await processSideImage(
          new AbortController().signal,
          { file, decoded, preprocessed: rotated },
          { rotate: { rotate: 90 } },
          job.processorState,
          { async quantize() {} },
          {
            async acquire() {
              assert.fail(`${label} must not call BEN2`);
            },
          },
          async () => assert.fail(`${label} cannot preflight BEN2`),
          () => assert.fail(`${label} cannot complete BEN2`),
        ),
        rotated,
      );
    }
  }
  const enabledPlan = gatingScheduler.plan(
    encodedSettings,
    [undefined, undefined],
    { state: 'supported' },
    true,
    false,
  );
  assert.ok(
    enabledPlan.jobs.every((job) => job.processorState.ben2.enabled),
    'supported cached encoded sides schedule effective per-side BEN2 work',
  );
  assert.ok(enabledPlan.work.every((work) => work.processing && work.encoding));

  const independentlyDisabled = [
    encodedSettings[0],
    {
      ...encodedSettings[1],
      processorState: {
        ...rightProcessorState,
        ben2: { enabled: false },
      },
    },
  ];
  const absentPlan = gatingScheduler.plan(
    independentlyDisabled,
    [undefined, undefined],
    { state: 'supported' },
    false,
    false,
  );
  assert.equal(
    independentlyDisabled[0].processorState.ben2.enabled,
    true,
    'left raw intent remains enabled',
  );
  assert.equal(
    independentlyDisabled[1].processorState.ben2.enabled,
    false,
    'right raw intent remains independently disabled',
  );
  assert.ok(
    absentPlan.jobs.every((job) => !job.processorState.ben2.enabled),
    'an absent model masks BEN2 in both effective jobs only',
  );
  for (const [label, resizeEnabled, quantizeEnabled] of [
    ['Resize', true, false],
    ['Quantize', false, true],
    ['Resize and Quantize', true, true],
  ]) {
    const rawEnabled = encodedSettings.map((side) => ({
      ...side,
      processorState: {
        ...side.processorState,
        resize: { ...side.processorState.resize, enabled: resizeEnabled },
        quantize: {
          ...side.processorState.quantize,
          enabled: quantizeEnabled,
        },
      },
    }));
    const previouslyCompleted = rawEnabled.map((side) => ({
      ...side,
      processorState: {
        ...side.processorState,
        ben2: { enabled: false },
      },
    }));
    const scheduler = new Ben2SideJobScheduler(defaults);
    const absentEnablePlan = scheduler.plan(
      rawEnabled,
      previouslyCompleted,
      { state: 'supported' },
      false,
      false,
    );
    assert.ok(
      absentEnablePlan.work.every((work) => !work.processing && !work.encoding),
      `absent BEN2 toggle with ${label} schedules zero processing/encoding`,
    );

    let downstreamCalls = 0;
    for (const [index, work] of absentEnablePlan.work.entries()) {
      if (!work.encoding) continue;
      downstreamCalls++;
      await processSideImage(
        new AbortController().signal,
        { file, decoded, preprocessed: rotated },
        { rotate: { rotate: 90 } },
        absentEnablePlan.jobs[index].processorState,
        {
          async quantize() {
            downstreamCalls++;
          },
        },
        {
          async acquire() {
            downstreamCalls++;
          },
        },
        async () => {
          downstreamCalls++;
          return false;
        },
        () => downstreamCalls++,
      );
    }
    assert.equal(
      downstreamCalls,
      0,
      `absent BEN2 toggle with ${label} reaches no downstream fake`,
    );

    const changedDownstream = rawEnabled.map((side) => ({
      ...side,
      processorState: {
        ...side.processorState,
        ...(resizeEnabled
          ? {
              resize: {
                ...side.processorState.resize,
                width: (side.processorState.resize.width || 1) + 1,
              },
            }
          : {
              quantize: {
                ...side.processorState.quantize,
                numColors: (side.processorState.quantize.numColors || 1) + 1,
              },
            }),
      },
    }));
    assert.ok(
      scheduler
        .plan(
          changedDownstream,
          previouslyCompleted,
          { state: 'supported' },
          false,
          false,
        )
        .work.every((work) => work.processing && work.encoding),
      `a genuine ${label} state change still schedules`,
    );
    assert.ok(
      scheduler
        .plan(
          rawEnabled,
          previouslyCompleted,
          { state: 'supported' },
          true,
          false,
        )
        .work.every((work) => work.processing && work.encoding),
      `cached BEN2 enable with ${label} still schedules`,
    );
  }

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

  let nonPngInput;
  let nonPngDecodes = 0;
  let nonPngRotates = 0;
  const nonPngCoordinator = createBen2Coordinator({
    async pngDecode() {
      nonPngDecodes++;
      return decoded;
    },
    async rotate() {
      nonPngRotates++;
      return rotated;
    },
    async ben2(_signal, input) {
      nonPngInput = input;
      return matte;
    },
    async reset() {},
  });
  const jpegSource = {
    ...commonSource,
    file: { name: 'input.jpg', type: 'image/jpeg' },
  };
  assert.equal(
    await nonPngCoordinator.acquire(
      jpegSource,
      { rotate: 90 },
      new AbortController().signal,
    ),
    matte,
  );
  assert.equal(nonPngInput, rotated);
  assert.deepEqual(
    [nonPngDecodes, nonPngRotates],
    [0, 0],
    'non-PNG coordinator path uses already-rotated shared preprocessing',
  );

  let invalidationResets = 0;
  const invalidatedCoordinator = createBen2Coordinator({
    async pngDecode() {
      return decoded;
    },
    async rotate() {
      return rotated;
    },
    ben2(signal) {
      return new Promise((_resolve, reject) => {
        signal.addEventListener(
          'abort',
          () => reject(new DOMException('AbortError', 'AbortError')),
          { once: true },
        );
      });
    },
    async reset() {
      invalidationResets++;
    },
  });
  const invalidated = invalidatedCoordinator.acquire(
    commonSource,
    { rotate: 90 },
    new AbortController().signal,
  );
  for (let tick = 0; tick < 12 && invalidationResets === 0; tick++) {
    await Promise.resolve();
  }
  invalidatedCoordinator.invalidate();
  await assert.rejects(invalidated, (error) => error?.name === 'AbortError');
  assert.equal(invalidationResets, 1, 'source invalidation resets shared work');

  let preflightAcquireCalls = 0;
  let preflightWorkerCalls = 0;
  let preflightError;
  await assert.rejects(
    processSideImage(
      new AbortController().signal,
      commonSource,
      { rotate: { rotate: 90 } },
      leftProcessorState,
      {
        async pngDecode() {
          preflightWorkerCalls++;
        },
        async rotate() {
          preflightWorkerCalls++;
        },
        async ben2() {
          preflightWorkerCalls++;
        },
        async quantize() {
          preflightWorkerCalls++;
        },
      },
      {
        async acquire() {
          preflightAcquireCalls++;
        },
      },
      async () => false,
      () => assert.fail('an absent preflight cannot complete BEN2'),
    ),
    (error) => {
      preflightError = error;
      return error?.name === 'Ben2ModelNotCachedError';
    },
  );
  assert.deepEqual(
    [preflightAcquireCalls, preflightWorkerCalls],
    [0, 0],
    'final model preflight prevents coordinator and bridge work',
  );
  const preflightScheduler = new Ben2SideJobScheduler(defaults);
  const preflightPlan = preflightScheduler.plan(
    encodedSettings,
    [undefined, undefined],
    { state: 'supported' },
    true,
    false,
  );
  preflightScheduler.start(0, preflightPlan.jobs[0]);
  let preflightSnackbars = 0;
  const preflightSettlement = preflightScheduler.settleFailure(
    0,
    preflightPlan.jobs[0],
    new AbortController().signal,
    preflightError,
  );
  if (preflightSettlement === 'error') preflightSnackbars++;
  assert.equal(preflightSettlement, 'model-not-cached');
  assert.equal(
    preflightSnackbars,
    0,
    'preflight cache miss is not a generic processing snackbar failure',
  );

  const vectorSource = { ...commonSource, vectorImage: { id: 'svg' } };
  const resized = { id: 'resized', width: 2, height: 2 };
  let completedBen2 = 0;
  resizeImplementation = async (_signal, resizeSource, options) => {
    assert.notEqual(
      resizeSource,
      vectorSource,
      'BEN2 routing uses a local SourceImage',
    );
    assert.equal(
      resizeSource.preprocessed,
      matte,
      'production Resize receives the BEN2 raster',
    );
    assert.equal(options.method, 'lanczos3');
    assert.equal(options.premultiply, true);
    assert.equal(options.linearRGB, true);
    return resized;
  };
  assert.equal(
    await processSideImage(
      new AbortController().signal,
      vectorSource,
      { rotate: { rotate: 90 } },
      {
        ...leftProcessorState,
        resize: { enabled: true, method: 'vector' },
      },
      { async quantize() {} },
      {
        async acquire() {
          return matte;
        },
      },
      async () => true,
      () => completedBen2++,
    ),
    resized,
  );
  assert.equal(completedBen2, 1);
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        ben2OptionsDecision({
          sourceHasVector: true,
          encoderState,
          processorState: leftProcessorState,
          capability: { state: 'supported' },
          modelCached: true,
        }),
      ),
    ),
    { effective: true, resizeIsVector: false },
    'production Options decision suppresses vector for effective BEN2',
  );
  assert.equal(
    ben2OptionsDecision({
      sourceHasVector: true,
      encoderState: undefined,
      processorState: leftProcessorState,
      capability: { state: 'supported' },
      modelCached: true,
    }).resizeIsVector,
    true,
  );
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        ben2OptionsDecision({
          sourceHasVector: true,
          encoderState,
          processorState: leftProcessorState,
          capability: { state: 'supported' },
          modelCached: false,
        }),
      ),
    ),
    { effective: false, resizeIsVector: true },
    'absent model does not suppress vector resize UI',
  );

  const processingOrder = [];
  resizeImplementation = async (_signal, resizeSource) => {
    processingOrder.push('resize');
    assert.equal(resizeSource.preprocessed, matte);
    return resized;
  };
  await processSideImage(
    new AbortController().signal,
    commonSource,
    { rotate: { rotate: 90 } },
    {
      ...leftProcessorState,
      resize: { enabled: true, method: 'lanczos3' },
      quantize: { enabled: true },
    },
    {
      async quantize(_signal, input) {
        processingOrder.push('quantize');
        assert.equal(input, resized);
        return input;
      },
    },
    {
      async acquire() {
        processingOrder.push('ben2');
        return matte;
      },
    },
    async () => true,
    () => {},
  );
  assert.deepEqual(
    processingOrder,
    ['ben2', 'resize', 'quantize'],
    'cached preflight preserves BEN2 → Resize → Quantize order',
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
  const retryScheduler = new Ben2SideJobScheduler(defaults);
  const retrySchedulerPlan = retryScheduler.plan(
    encodedSettings,
    [undefined, undefined],
    { state: 'supported' },
    true,
    false,
  );
  const sharedTerminalError = new Error('shared worker failure');
  sharedTerminalError.name = 'Ben2TerminalError';
  for (const index of [0, 1]) {
    retryScheduler.start(index, retrySchedulerPlan.jobs[index]);
    assert.equal(
      retryScheduler.settleFailure(
        index,
        retrySchedulerPlan.jobs[index],
        new AbortController().signal,
        sharedTerminalError,
      ),
      'terminal',
    );
  }
  const terminalToggleRetry = new Ben2TerminalToggleRetry(
    terminalCoordinator,
    retryScheduler,
  );
  const leftDisabledState = {
    ...leftProcessorState,
    ben2: { enabled: false },
  };
  assert.equal(
    terminalToggleRetry.processorChange(
      0,
      leftProcessorState,
      leftDisabledState,
      commonSource,
    ),
    leftDisabledState,
    'terminal BEN2 on→off arms the production toggle retry path',
  );
  retryScheduler.clearTerminal(0);
  const leftRetriedState = terminalToggleRetry.processorChange(
    0,
    leftDisabledState,
    leftProcessorState,
    commonSource,
  );
  assert.notEqual(
    leftRetriedState,
    leftProcessorState,
    'terminal off→on churns the intended side processor identity',
  );
  assert.equal(retryScheduler.terminalJob(0), undefined);
  assert.equal(
    retryScheduler.terminalJob(1),
    retrySchedulerPlan.jobs[1],
    'terminal off→on leaves the other scheduler identity latched',
  );
  assert.equal(
    await terminalCoordinator.acquire(
      commonSource,
      { rotate: 90 },
      terminalSignal,
    ),
    matte,
  );
  assert.equal(
    attempts,
    2,
    'production terminal toggle path clears the shared coordinator record',
  );
  const productionRetryPlan = retryScheduler.plan(
    [
      { ...encodedSettings[0], processorState: leftRetriedState },
      encodedSettings[1],
    ],
    [
      { ...encodedSettings[0], processorState: leftDisabledState },
      encodedSettings[1],
    ],
    { state: 'supported' },
    true,
    false,
  );
  assert.deepEqual(
    productionRetryPlan.work.map(({ encoding }) => encoding),
    [true, false],
    'production terminal toggle path schedules only the intended side',
  );

  let healthyRetryCalls = 0;
  const ordinaryToggleRetry = new Ben2TerminalToggleRetry(
    { retry: () => healthyRetryCalls++ },
    {
      terminalJob: () => undefined,
      retryTerminal() {},
    },
  );
  ordinaryToggleRetry.processorChange(
    0,
    leftDisabledState,
    leftProcessorState,
    commonSource,
  );
  ordinaryToggleRetry.processorChange(
    0,
    leftProcessorState,
    leftDisabledState,
    commonSource,
  );
  ordinaryToggleRetry.processorChange(
    0,
    leftDisabledState,
    leftProcessorState,
    commonSource,
  );
  assert.equal(
    healthyRetryCalls,
    0,
    'ordinary first enable and nonterminal toggles do not reset shared work',
  );

  const sideScheduler = new Ben2SideJobScheduler(defaults);
  const initialSidePlan = sideScheduler.plan(
    encodedSettings,
    [undefined, undefined],
    { state: 'supported' },
    true,
    false,
  );
  const previousSides = [
    {
      loading: true,
      file: { id: 'old-left-file' },
      data: { id: 'old-left-data' },
      downloadUrl: 'blob:old-left',
    },
    {
      loading: true,
      file: { id: 'old-right-file' },
      data: { id: 'old-right-data' },
      downloadUrl: 'blob:old-right',
    },
  ];
  const terminalError = new Error('shared worker failure');
  terminalError.name = 'Ben2TerminalError';
  const settledSides = [];
  for (const index of [0, 1]) {
    sideScheduler.start(index, initialSidePlan.jobs[index]);
    assert.equal(
      sideScheduler.settleFailure(
        index,
        initialSidePlan.jobs[index],
        new AbortController().signal,
        terminalError,
      ),
      'terminal',
      `shared failure records side ${index} independently`,
    );
    settledSides[index] = ben2TerminalSideState(previousSides[index]);
    assert.equal(settledSides[index].loading, false);
    assert.equal(settledSides[index].file, previousSides[index].file);
    assert.equal(settledSides[index].data, previousSides[index].data);
    assert.equal(
      settledSides[index].downloadUrl,
      previousSides[index].downloadUrl,
    );
  }
  for (const unrelatedUpdate of ['rerender', 'cache-state']) {
    const idle = sideScheduler.plan(
      encodedSettings,
      encodedSettings,
      { state: 'supported' },
      true,
      false,
    );
    assert.ok(
      idle.work.every((work) => !work.processing && !work.encoding),
      `terminal sides remain quiescent across ${unrelatedUpdate}`,
    );
  }

  sideScheduler.retryTerminal(0);
  const retriedSettings = [
    {
      ...encodedSettings[0],
      processorState: ben2RetryProcessorState(leftProcessorState),
    },
    encodedSettings[1],
  ];
  const retryPlan = sideScheduler.plan(
    retriedSettings,
    encodedSettings,
    { state: 'supported' },
    true,
    false,
  );
  assert.equal(
    retryPlan.work.filter((work) => work.encoding).length,
    1,
    'one-side Retry schedules exactly one fresh side call',
  );
  assert.equal(sideScheduler.terminalJob(1), initialSidePlan.jobs[1]);
  sideScheduler.start(0, retryPlan.jobs[0]);
  assert.equal(sideScheduler.terminalJob(0), undefined);

  const disableScheduler = new Ben2SideJobScheduler(defaults);
  const disablePlan = disableScheduler.plan(
    encodedSettings,
    [undefined, undefined],
    { state: 'supported' },
    true,
    false,
  );
  disableScheduler.start(0, disablePlan.jobs[0]);
  disableScheduler.start(1, disablePlan.jobs[1]);
  disableScheduler.settleFailure(
    0,
    disablePlan.jobs[0],
    new AbortController().signal,
    terminalError,
  );
  disableScheduler.settleFailure(
    1,
    disablePlan.jobs[1],
    new AbortController().signal,
    terminalError,
  );
  const disabledSettings = [
    {
      ...encodedSettings[0],
      processorState: { ...leftProcessorState, ben2: { enabled: false } },
    },
    encodedSettings[1],
  ];
  const disableSupersession = disableScheduler.plan(
    disabledSettings,
    encodedSettings,
    { state: 'supported' },
    true,
    false,
  );
  disableScheduler.start(0, disableSupersession.jobs[0]);
  assert.equal(
    disableScheduler.terminalJob(0),
    undefined,
    'disable/settings supersession clears only that terminal identity',
  );
  assert.equal(disableScheduler.terminalJob(1), disablePlan.jobs[1]);
  disableScheduler.invalidate();
  assert.equal(disableScheduler.terminalJob(1), undefined);
  assert.ok(
    disableScheduler
      .plan(
        encodedSettings,
        [undefined, undefined],
        { state: 'supported' },
        true,
        false,
      )
      .work.every((work) => work.encoding),
    'source invalidation clears terminal scheduling identities',
  );

  const evictionScheduler = new Ben2SideJobScheduler(defaults);
  const beforeEviction = evictionScheduler.plan(
    encodedSettings,
    [undefined, undefined],
    { state: 'supported' },
    true,
    false,
  );
  assert.ok(
    beforeEviction.jobs.every((job) => job.processorState.ben2.enabled),
  );
  const afterEviction = evictionScheduler.plan(
    encodedSettings,
    beforeEviction.jobs,
    { state: 'supported' },
    false,
    false,
  );
  assert.ok(
    afterEviction.jobs.every((job) => !job.processorState.ben2.enabled),
    'eviction masks both effective jobs',
  );
  assert.ok(
    encodedSettings.every((side) => side.processorState.ben2.enabled),
    'eviction preserves both raw side intents',
  );
  assert.ok(
    afterEviction.work.every((work) => work.processing && work.encoding),
    'eviction schedules both sides back to non-BEN2 output',
  );

  const staleScheduler = new Ben2SideJobScheduler(defaults);
  const oldJob = initialSidePlan.jobs[0];
  const newerJob = {
    ...oldJob,
    processorState: ben2RetryProcessorState(oldJob.processorState),
  };
  const liveSignal = new AbortController().signal;
  staleScheduler.start(0, oldJob);
  staleScheduler.start(0, newerJob);
  assert.equal(staleScheduler.isCurrent(0, oldJob, liveSignal), false);
  assert.equal(staleScheduler.complete(0, oldJob), false);
  assert.equal(
    staleScheduler.settleFailure(0, oldJob, liveSignal, terminalError),
    'stale',
  );
  assert.equal(
    staleScheduler.isCurrent(0, newerJob, liveSignal),
    true,
    'stale success/failure cannot clear a newer side job',
  );
  const abortedNewer = new AbortController();
  abortedNewer.abort();
  assert.equal(
    staleScheduler.settleFailure(
      0,
      newerJob,
      abortedNewer.signal,
      terminalError,
    ),
    'stale',
  );
  assert.equal(staleScheduler.isCurrent(0, newerJob, liveSignal), true);
  assert.equal(staleScheduler.complete(0, newerJob), true);

  // Execute the production cache lifecycle controller used by Compress. This
  // covers the state/event path without mounting the legacy component tree.
  const cacheLifecyclePath = new URL(
    'src/client/lazy-app/Compress/ben2-cache-lifecycle.ts',
    root,
  );
  const cacheLifecycleModule = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(await readFile(cacheLifecyclePath, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
    {
      exports: cacheLifecycleModule.exports,
      module: cacheLifecycleModule,
      Promise,
    },
  );
  const { Ben2CacheLifecycle } = cacheLifecycleModule.exports;
  assert.equal(typeof Ben2CacheLifecycle, 'function');

  class FakeEventTarget {
    listeners = new Map();
    addEventListener(type, listener) {
      const listeners = this.listeners.get(type) || new Set();
      listeners.add(listener);
      this.listeners.set(type, listeners);
    }
    removeEventListener(type, listener) {
      this.listeners.get(type)?.delete(listener);
    }
    dispatch(type) {
      for (const listener of this.listeners.get(type) || []) listener();
    }
    listenerCount() {
      return [...this.listeners.values()].reduce(
        (total, listeners) => total + listeners.size,
        0,
      );
    }
  }

  const lifecycleWindow = new FakeEventTarget();
  const lifecycleDocument = new FakeEventTarget();
  lifecycleDocument.visibilityState = 'visible';
  const lifecycleServiceWorker = new FakeEventTarget();
  const lifecycleTimers = new Map();
  let nextLifecycleTimer = 0;
  const lifecycleEnvironment = {
    window: lifecycleWindow,
    document: lifecycleDocument,
    serviceWorker: lifecycleServiceWorker,
    setInterval(callback, delay) {
      assert.equal(delay, 2_000);
      const id = ++nextLifecycleTimer;
      lifecycleTimers.set(id, callback);
      return id;
    },
    clearInterval(id) {
      lifecycleTimers.delete(id);
    },
  };
  let lifecycleEnabled = true;
  let lifecycleStatusCalls = 0;
  const lifecycleStatuses = [];
  let statusGate = deferred();
  const lifecycle = new Ben2CacheLifecycle(
    {
      isEnabled: () => lifecycleEnabled,
      readCached: () => {
        lifecycleStatusCalls++;
        return statusGate.promise;
      },
      download: async () => assert.fail('download is tested separately'),
      setCached: (cached) => lifecycleStatuses.push(cached),
      setDownloading: () => {},
    },
    lifecycleEnvironment,
  );
  lifecycle.mount();
  assert.equal(lifecycleStatusCalls, 1);
  assert.equal(lifecycleTimers.size, 1, 'one shared polling interval');
  lifecycleWindow.dispatch('focus');
  lifecycleDocument.dispatch('visibilitychange');
  lifecycleServiceWorker.dispatch('controllerchange');
  for (const callback of lifecycleTimers.values()) callback();
  assert.equal(
    lifecycleStatusCalls,
    1,
    'focus/visibility/controller/poll share one non-overlapping status request',
  );
  statusGate.resolve(true);
  await lifecycle.refresh();
  assert.deepEqual(lifecycleStatuses, [true]);

  statusGate = deferred();
  lifecycleWindow.dispatch('focus');
  assert.equal(lifecycleStatusCalls, 2);
  statusGate.resolve(false);
  await lifecycle.refresh();
  assert.deepEqual(
    lifecycleStatuses,
    [true, false],
    'one shared cached state observes cached→absent',
  );
  lifecycleDocument.visibilityState = 'hidden';
  lifecycleDocument.dispatch('visibilitychange');
  assert.equal(lifecycleStatusCalls, 2, 'hidden visibility does not refresh');
  lifecycleEnabled = false;
  lifecycle.updatePolling();
  assert.equal(lifecycleTimers.size, 0, 'disabled sides stop polling');
  lifecycle.dispose();
  assert.equal(lifecycleWindow.listenerCount(), 0);
  assert.equal(lifecycleDocument.listenerCount(), 0);
  assert.equal(lifecycleServiceWorker.listenerCount(), 0);
  lifecycleWindow.dispatch('focus');
  assert.equal(lifecycleStatusCalls, 2, 'disposed lifecycle cannot refresh');

  const downloadWindow = new FakeEventTarget();
  const downloadDocument = new FakeEventTarget();
  downloadDocument.visibilityState = 'visible';
  const downloadServiceWorker = new FakeEventTarget();
  let downloadAttempts = 0;
  let downloadStatusCalls = 0;
  const downloadingStates = [];
  const refreshedDownloadStates = [];
  const downloadLifecycle = new Ben2CacheLifecycle(
    {
      isEnabled: () => false,
      readCached: async () => {
        downloadStatusCalls++;
        return downloadAttempts > 1;
      },
      download: async () => {
        downloadAttempts++;
        if (downloadAttempts === 1) {
          throw new Error('Service worker stopped responding');
        }
      },
      setCached: (cached) => refreshedDownloadStates.push(cached),
      setDownloading: (downloading) => downloadingStates.push(downloading),
    },
    {
      window: downloadWindow,
      document: downloadDocument,
      serviceWorker: downloadServiceWorker,
      setInterval: () => assert.fail('disabled lifecycle cannot poll'),
      clearInterval: () => {},
    },
  );
  await Promise.all([
    downloadLifecycle.download(),
    downloadLifecycle.download(),
  ]);
  assert.deepEqual(downloadingStates, [true, false]);
  assert.equal(downloadAttempts, 1, 'shared failing download is deduplicated');
  assert.equal(downloadStatusCalls, 1, 'failure performs one status refresh');
  assert.deepEqual(
    refreshedDownloadStates,
    [false],
    'orphan-only restart remains absent after liveness loss',
  );
  await downloadLifecycle.download();
  assert.equal(downloadAttempts, 2, 'liveness failure remains retryable');
  assert.equal(downloadStatusCalls, 2);
  assert.deepEqual(refreshedDownloadStates, [false, true]);
  assert.deepEqual(downloadingStates, [true, false, true, false]);
  downloadLifecycle.dispose();

  const canonicalDownloadingStates = [];
  const canonicalCachedStates = [];
  const canonicalLifecycle = new Ben2CacheLifecycle(
    {
      isEnabled: () => false,
      readCached: async () => true,
      download: async () => {
        throw new Error('Service worker stopped responding');
      },
      setCached: (cached) => canonicalCachedStates.push(cached),
      setDownloading: (downloading) =>
        canonicalDownloadingStates.push(downloading),
    },
    {
      window: new FakeEventTarget(),
      document: Object.assign(new FakeEventTarget(), {
        visibilityState: 'visible',
      }),
      serviceWorker: new FakeEventTarget(),
      setInterval: () => assert.fail('disabled lifecycle cannot poll'),
      clearInterval: () => {},
    },
  );
  await canonicalLifecycle.download();
  assert.deepEqual(canonicalCachedStates, [true]);
  assert.deepEqual(
    canonicalDownloadingStates,
    [true, false],
    'liveness loss refreshes a surviving canonical model and reenables UI',
  );
  canonicalLifecycle.dispose();

  const compress = await readFile(
    new URL('src/client/lazy-app/Compress/index.tsx', root),
    'utf8',
  );
  const options = await readFile(
    new URL('src/client/lazy-app/Compress/Options/index.tsx', root),
    'utf8',
  );
  const optionsCss = await readFile(
    new URL('src/client/lazy-app/Compress/Options/style.css', root),
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
  assert.doesNotMatch(compress, /preprocessorState\.ben2/);
  assert.match(options, />\s*Remove background\s*</);
  assert.doesNotMatch(options, /Remove background \(BEN2\)/);
  assert.match(options, /name="ben2\.enable"/);
  assert.match(options, /onChange={this\.onProcessorEnabledChange}/);
  assert.match(
    options,
    /<label class={style\.sectionEnabler}>\s*Remove background\s*<Toggle[\s\S]*?name="ben2\.enable"[\s\S]*?<\/label>\s*<Expander>/,
    'BEN2 uses the native label/Toggle/immediately-following Expander shape',
  );
  assert.match(
    options,
    /<Expander>\s*{processorState\.ben2\.enabled \? \(/,
    'each side expands from its own raw BEN2 intent',
  );
  assert.equal(
    (options.match(/BEN2 Neural Network is cached\./g) || []).length,
    1,
  );
  assert.equal(
    (options.match(/BEN2 Neural Network is not cached\./g) || []).length,
    1,
  );
  assert.match(options, /prettyBytes\(modelBytes\)/);
  assert.match(options, /Download BEN2 Neural Network/);
  assert.match(
    options,
    /<section class={style\.ben2Panel} aria-live="polite">/,
  );
  assert.match(
    options,
    /<button\s+class={style\.ben2Download}\s+type="button"\s+disabled={ben2Downloading}\s+onClick={onBen2Download}\s*>/,
    'BEN2 download retains its native button behavior under the local class',
  );
  assert.match(
    optionsCss,
    /\.ben2-panel\s*{\s*composes:\s*option-one-cell;\s*composes:\s*options-section;\s*row-gap:\s*8px;/,
    'BEN2 panel composes the native one-cell and section recipes',
  );
  assert.match(
    optionsCss,
    /\.ben2-download\s*{\s*composes:\s*text-field;/,
    'BEN2 download composes the native text-field recipe',
  );
  for (const contract of [
    /&:hover:not\(:disabled\)\s*{\s*background-color:\s*var\(--dark-gray\);/,
    /&:active:not\(:disabled\)\s*{\s*background-color:\s*var\(--main-theme-color\);\s*color:\s*var\(--header-text-color\);/,
    /&:focus-visible\s*{\s*outline:\s*var\(--white\) solid 2px;/,
    /&:disabled\s*{\s*color:\s*var\(--less-light-gray\);/,
  ]) {
    assert.match(
      optionsCss,
      contract,
      `BEN2 download style contract: ${contract}`,
    );
  }
  const ben2Panel = options.slice(
    options.indexOf('Remove background'),
    options.indexOf('{encoderState ?'),
  );
  assert.equal(
    (ben2Panel.match(/<button/g) || []).length,
    1,
    'absent BEN2 panel has exactly one button declaration',
  );
  for (const forbidden of [
    /Checking WebGPU support/i,
    /service worker/i,
    /Runtime assets/i,
    /partially cached/i,
    /First use/i,
    /Select an output format/i,
    /Removing background/i,
    /Retry/i,
    /JPEG/i,
    /OxiPNG/i,
    /Browser PNG/i,
    /transparen/i,
  ]) {
    assert.doesNotMatch(
      options,
      forbidden,
      `forbidden BEN2 copy: ${forbidden}`,
    );
  }

  const prettyBytesPath = new URL(
    'src/client/lazy-app/Compress/Results/pretty-bytes.ts',
    root,
  );
  const prettyBytesModule = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(await readFile(prettyBytesPath, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
    {
      exports: prettyBytesModule.exports,
      module: prettyBytesModule,
      Math,
    },
  );
  const modelBytesMatch = processorMeta.match(/modelBytes\s*=\s*([\d_]+)/);
  assert.ok(modelBytesMatch, 'BEN2 metadata exports modelBytes');
  const modelBytes = Number(modelBytesMatch[1].replaceAll('_', ''));
  assert.equal(modelBytes, 219_121_675);
  assert.deepEqual(
    JSON.parse(JSON.stringify(prettyBytesModule.exports.default(modelBytes))),
    { value: '219', unit: 'MB' },
  );
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
  let timerNow = 0;
  function advanceTimersBy(duration) {
    const target = timerNow + duration;
    while (true) {
      const next = [...timers.entries()]
        .filter(([, timer]) => timer.due <= target)
        .sort((left, right) => left[1].due - right[1].due)[0];
      if (!next) break;
      const [id, timer] = next;
      timers.delete(id);
      timerNow = timer.due;
      timer.callback();
    }
    timerNow = target;
  }
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
      assert.ok(delay > 0 && delay <= 30_000, 'transport timeout is bounded');
      const id = ++nextTimer;
      timers.set(id, { callback, delay, due: timerNow + delay });
      return id;
    },
  });
  const { ben2CacheStatus, ben2ModelIsCached, downloadBen2Model } =
    bridgeModule.exports;
  assert.equal(typeof ben2ModelIsCached, 'function');
  assert.equal(typeof downloadBen2Model, 'function');
  const fallback = { controlled: false, entries: [], offlineReady: false };

  assert.deepEqual(
    JSON.parse(JSON.stringify(await ben2CacheStatus())),
    fallback,
  );

  serviceWorker.controller = { postMessage() {} };
  const timeoutStatus = ben2CacheStatus();
  assert.equal(timers.size, 1);
  advanceTimersBy([...timers.values()][0].delay);
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
  assert.equal(ben2ModelIsCached(success), true);
  assert.equal(
    ben2ModelIsCached({ ...success, offlineReady: false }),
    true,
    'model eligibility does not require the other five cached roles',
  );
  assert.equal(
    ben2ModelIsCached({
      ...success,
      entries: success.entries.map((entry) =>
        entry.role === 'model' ? { ...entry, cached: false } : entry,
      ),
    }),
    false,
  );
  assert.equal(
    ben2ModelIsCached({
      ...success,
      entries: [
        ...success.entries,
        { role: 'model', path: '/duplicate', cached: true },
      ],
    }),
    false,
    'duplicate model roles are never confirmation',
  );
  assert.equal(ben2ModelIsCached(fallback), false);
  assert.equal(listeners.size, 0);
  assert.equal(timers.size, 0);

  serviceWorker.controller = {
    postMessage(_message, ports) {
      ports[0].postMessage({
        ok: true,
        cacheName: 'static-v1',
        entries: [...entries, entries[1]],
      });
    },
  };
  assert.deepEqual(
    JSON.parse(JSON.stringify(await ben2CacheStatus())),
    fallback,
    'malformed duplicate-role status is conservative',
  );

  let downloadPosts = 0;
  let downloadPort;
  let downloadMessage;
  serviceWorker.controller = {
    postMessage(message, ports) {
      downloadPosts++;
      downloadMessage = message;
      downloadPort = ports[0];
    },
  };
  const firstDownload = downloadBen2Model();
  const secondDownload = downloadBen2Model();
  assert.equal(downloadPosts, 1, 'client deduplicates simultaneous downloads');
  assert.deepEqual(
    JSON.parse(JSON.stringify(downloadMessage)),
    { action: 'ben2-download-model' },
    'client sends no model identity fields',
  );
  let longDownloadSettled = false;
  firstDownload.finally(() => {
    longDownloadSettled = true;
  });
  const watchdogDelay = [...timers.values()][0].delay;
  assert.ok(watchdogDelay > 5_000, 'watchdog exceeds heartbeat cadence');
  for (let elapsed = 0; elapsed <= watchdogDelay; elapsed += 5_000) {
    advanceTimersBy(5_000);
    downloadPort.postMessage({ type: 'heartbeat' });
  }
  assert.equal(
    longDownloadSettled,
    false,
    'heartbeats keep a transfer alive beyond one watchdog duration',
  );
  downloadPort.postMessage({ ok: true });
  await Promise.all([firstDownload, secondDownload]);
  assert.equal(listeners.size, 0, 'successful download cleans listeners');
  assert.equal(
    channels.at(-1).port1.closed,
    true,
    'successful download closes ports',
  );
  assert.equal(timers.size, 0, 'successful download clears watchdog');

  let silentPosts = 0;
  serviceWorker.controller = {
    postMessage() {
      silentPosts++;
    },
  };
  const silentDownload = downloadBen2Model();
  const silentWatchdog = [...timers.values()][0];
  advanceTimersBy(silentWatchdog.delay);
  await assert.rejects(silentDownload, /stopped responding/i);
  assert.equal(channels.at(-1).port1.closed, true);
  assert.equal(listeners.size, 0);
  assert.equal(timers.size, 0);
  serviceWorker.controller = {
    postMessage(_message, ports) {
      silentPosts++;
      ports[0].postMessage({ ok: true });
    },
  };
  await downloadBen2Model();
  assert.equal(silentPosts, 2, 'watchdog rejection clears dedupe for retry');

  serviceWorker.controller = {
    postMessage(_message, ports) {
      ports[0].postMessage({ ok: false, error: 'model-download-failed' });
    },
  };
  await assert.rejects(downloadBen2Model(), /model download failed/i);
  assert.equal(listeners.size, 0, 'failure cleans controller listener');
  assert.equal(timers.size, 0, 'failure clears watchdog');
  assert.equal(channels.at(-1).port1.closed, true, 'failure closes ports');
  const postsBeforeRetry = downloadPosts;
  serviceWorker.controller = {
    postMessage(_message, ports) {
      downloadPosts++;
      ports[0].postMessage({ ok: true });
    },
  };
  await downloadBen2Model();
  assert.equal(
    downloadPosts,
    postsBeforeRetry + 1,
    'failed client operation clears dedupe for retry',
  );

  serviceWorker.controller = {
    postMessage() {},
  };
  const changedDownload = downloadBen2Model();
  for (const listener of [...listeners]) listener();
  await assert.rejects(changedDownload, /controller changed/i);
  assert.equal(listeners.size, 0);
  assert.equal(timers.size, 0, 'controller change clears watchdog');
  assert.equal(channels.at(-1).port1.closed, true);

  serviceWorker.controller = {
    postMessage(_message, ports) {
      ports[0].postMessage({ ok: 'yes' });
    },
  };
  await assert.rejects(downloadBen2Model(), /invalid model download response/i);
  assert.equal(listeners.size, 0);
  assert.equal(timers.size, 0, 'malformed response clears watchdog');
  assert.equal(channels.at(-1).port1.closed, true);

  serviceWorker.controller = undefined;
  await assert.rejects(downloadBen2Model(), /not controlled/i);

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
  const inventory = entries.map(({ role, path }) => ({
    role,
    path,
    ...(role === 'model' ? { bytes: 219_121_675 } : {}),
  }));
  let opens = 0;
  let stagingReaps = 0;
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
          deleteBen2ModelStaging: async () => {
            stagingReaps++;
          },
          cacheBasics: async () => {},
          cacheAdditionalProcessors: async () => {},
          serveShareTarget() {},
          matchValidatedBen2Model: (path, cacheName) =>
            swContext.caches.match(
              new URL(path, swContext.location.origin).href,
              { cacheName },
            ),
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
  assert.equal(
    stagingReaps,
    1,
    'fresh status delegates one body-free staging reap',
  );
  assert.equal(opens, 0, 'inventory reads do not open or create a cache');
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
