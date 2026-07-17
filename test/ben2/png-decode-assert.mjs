import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const fixtureUrl = new URL(
  './fixtures/procedural-rgba-333x517.png',
  import.meta.url,
);
const sourceUrl = new URL(
  '../../src/features/decoders/png/worker/pngDecode.ts',
  import.meta.url,
);

class TestImageData {
  constructor(data, width, height) {
    assert.equal(data.length, width * height * 4);
    this.data = data;
    this.width = width;
    this.height = height;
  }
}
globalThis.ImageData = TestImageData;

async function loadPngCodec() {
  const js = await readFile(
    new URL('../../codecs/png/pkg/squoosh_png.js', import.meta.url),
    'utf8',
  );
  const module = await import(
    `data:text/javascript;base64,${Buffer.from(js).toString('base64')}`
  );
  const wasm = await readFile(
    new URL('../../codecs/png/pkg/squoosh_png_bg.wasm', import.meta.url),
  );
  await module.default(wasm);
  return module;
}

const source = await readFile(sourceUrl, 'utf8');
assert.match(source, /blobToArrayBuffer/);
assert.match(source, /import\('codecs\/png\/pkg'\)/);
assert.doesNotMatch(source, /canvas/i);

const codec = await loadPngCodec();
const decoded = codec.decode(new Uint8Array(await readFile(fixtureUrl)));
assert.equal(decoded.width, 333);
assert.equal(decoded.height, 517);
assert.equal(decoded.data.length, 333 * 517 * 4);
assert.equal(
  createHash('sha256').update(decoded.data).digest('hex'),
  '7da56989453d8dd96b2e93a8a3b7a0ab3765095b3681e8cd40a649d7781e92ff',
  'the PNG decoder must preserve straight RGB, including hidden RGB',
);

let hiddenRgbPixels = 0;
for (let offset = 0; offset < decoded.data.length; offset += 4) {
  if (
    decoded.data[offset + 3] === 0 &&
    (decoded.data[offset] !== 0 ||
      decoded.data[offset + 1] !== 0 ||
      decoded.data[offset + 2] !== 0)
  ) {
    hiddenRgbPixels++;
  }
}
assert.ok(hiddenRgbPixels > 0, 'fixture must exercise straight hidden RGB');

// Execute the production loader: a rejected module initialization must be
// cleared so one later explicit Retry performs a fresh load in the same worker.
const require = createRequire(import.meta.url);
let ts;
try {
  ts = require('typescript');
} catch {
  throw new Error('png-decode-assert requires the TypeScript dependency');
}
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;
let moduleLoads = 0;
const decodeResult = { width: 1, height: 1, data: new Uint8ClampedArray(4) };
const productionModule = { exports: {} };
vm.runInNewContext(compiled, {
  exports: productionModule.exports,
  module: productionModule,
  require(specifier) {
    if (specifier === 'features/worker-utils') {
      return { blobToArrayBuffer: async () => new ArrayBuffer(4) };
    }
    if (specifier === 'codecs/png/pkg') {
      moduleLoads++;
      return moduleLoads === 1
        ? { default: async () => Promise.reject(new Error('WASM missing')) }
        : {
            default: async () => {},
            decode: () => decodeResult,
          };
    }
    throw new Error(`Unexpected PNG decoder import: ${specifier}`);
  },
  ArrayBuffer,
  Error,
  Promise,
  Uint8Array,
});
const productionDecode = productionModule.exports.default;
await assert.rejects(
  productionDecode({}),
  (error) => error?.name === 'PngModuleLoadError',
  'asset-load failures are identified for BEN2 terminal recovery',
);
assert.equal(await productionDecode({}), decodeResult);
assert.equal(moduleLoads, 2, 'Retry reloads after rejected initialization');
assert.equal(await productionDecode({}), decodeResult);
assert.equal(moduleLoads, 2, 'successful initialization remains cached');

console.log('png-decode-assert: PASS');
