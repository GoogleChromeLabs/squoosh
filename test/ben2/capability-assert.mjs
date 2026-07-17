import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
let ts;
try {
  ts = require('typescript');
} catch {
  throw new Error(
    'capability-assert requires the repository TypeScript dependency',
  );
}

async function loadCapabilityModule() {
  const filename = new URL(
    '../../src/client/lazy-app/Compress/ben2-capability.ts',
    import.meta.url,
  );
  const source = await readFile(filename, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    exports: module.exports,
    module,
    require() {
      throw new Error('The capability probe must not import runtime modules');
    },
  });
  return { source, ...module.exports };
}

const { source, probeBen2Capability } = await loadCapabilityModule();
assert.equal(typeof probeBen2Capability, 'function');
assert.doesNotMatch(
  source,
  /onnx|model|onnxruntime|fetch\s*\(|userAgent|chrome|brands/i,
);

function environment(overrides = {}) {
  let destroyed = 0;
  let adapterOptions;
  let deviceOptions;
  const device = { destroy: () => destroyed++ };
  const adapter = {
    features: new Set(['shader-f16']),
    async requestDevice(options) {
      deviceOptions = options;
      return device;
    },
  };
  const gpu = {
    async requestAdapter(options) {
      adapterOptions = options;
      return adapter;
    },
  };
  return {
    value: { isSecureContext: true, gpu, ...overrides },
    observations: () => ({ destroyed, adapterOptions, deviceOptions }),
  };
}

{
  const test = environment();
  assert.equal((await probeBen2Capability(test.value)).state, 'supported');
  const observed = test.observations();
  assert.equal(
    JSON.stringify(observed.adapterOptions),
    JSON.stringify({ forceFallbackAdapter: false }),
  );
  assert.equal(
    JSON.stringify(observed.deviceOptions),
    JSON.stringify({ requiredFeatures: ['shader-f16'] }),
  );
  assert.equal(observed.destroyed, 1);
}

assert.equal(
  (await probeBen2Capability(environment({ isSecureContext: false }).value))
    .state,
  'unsupported',
);
assert.match(
  (await probeBen2Capability(environment({ isSecureContext: false }).value))
    .reason,
  /secure/i,
);
assert.match(
  (await probeBen2Capability(environment({ gpu: undefined }).value)).reason,
  /webgpu/i,
);

{
  const test = environment({
    gpu: {
      async requestAdapter() {
        return null;
      },
    },
  });
  assert.match((await probeBen2Capability(test.value)).reason, /adapter/i);
}

{
  const adapter = {
    features: new Set(),
    async requestDevice() {
      assert.fail('requestDevice must not run without shader-f16');
    },
  };
  const test = environment({
    gpu: {
      async requestAdapter() {
        return adapter;
      },
    },
  });
  assert.match((await probeBen2Capability(test.value)).reason, /shader-f16/i);
}

{
  const adapter = {
    features: new Set(['shader-f16']),
    async requestDevice() {
      throw new Error('device rejected');
    },
  };
  const test = environment({
    gpu: {
      async requestAdapter() {
        return adapter;
      },
    },
  });
  assert.match((await probeBen2Capability(test.value)).reason, /device/i);
}

console.log('BEN2 capability assertion passed');
