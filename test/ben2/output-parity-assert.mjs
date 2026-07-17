import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const cases = {
  rgb: {
    source: 'procedural-rgb-640x360.png',
    alpha: 'procedural-rgb-640x360-transformers-alpha.u8',
    width: 640,
    height: 360,
    sourceHash:
      'affb54b1f43a08f20c55bed157bbfebfd1ff01b9f41b57479f4093368c0b0cfa',
    alphaHash:
      '8b3f6d9973dd76eb6ef469b1c76d7d69b6e585bd3842c7e733e01d472ae2dfb7',
  },
  rgba: {
    source: 'procedural-rgba-333x517.png',
    alpha: 'procedural-rgba-333x517-transformers-alpha.u8',
    width: 333,
    height: 517,
    sourceHash:
      '0cef624b6c4baba86d574a2bd77db6020d9bd670c24f7c568510398d2d436216',
    alphaHash:
      '31e364ad0d88b6b4f88b50f335c6810279e6e5684591e7c5866f4d8a0d302731',
  },
};

class TestImageData {
  constructor(data, width, height) {
    assert.equal(data.length, width * height * 4);
    this.data = data;
    this.width = width;
    this.height = height;
  }
}
globalThis.ImageData = TestImageData;

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

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

const fixtureBytes = {};
for (const [name, fixture] of Object.entries(cases)) {
  const source = await readFile(
    new URL(`./fixtures/${fixture.source}`, import.meta.url),
  );
  const alpha = await readFile(
    new URL(`./fixtures/${fixture.alpha}`, import.meta.url),
  );
  assert.equal(sha256(source), fixture.sourceHash, `${name} source hash`);
  assert.equal(sha256(alpha), fixture.alphaHash, `${name} alpha hash`);
  assert.equal(alpha.length, fixture.width * fixture.height);
  fixtureBytes[name] = { source, alpha };
}

const [caseName, exportedPath] = process.argv.slice(2);
if (!caseName && !exportedPath) {
  console.log('output-parity-assert: PASS (fixture identities)');
  process.exit(0);
}
if (!(caseName in cases) || !exportedPath || process.argv.length !== 4) {
  throw new Error(
    'Usage: node test/ben2/output-parity-assert.mjs <rgb|rgba> <exported.png>',
  );
}

const fixture = cases[caseName];
const codec = await loadPngCodec();
const source = codec.decode(new Uint8Array(fixtureBytes[caseName].source));
const exported = codec.decode(new Uint8Array(await readFile(exportedPath)));
const authority = fixtureBytes[caseName].alpha;

assert.equal(source.width, fixture.width, 'source width');
assert.equal(source.height, fixture.height, 'source height');
assert.equal(exported.width, fixture.width, 'exported width');
assert.equal(exported.height, fixture.height, 'exported height');

let visibleRgbDifferences = 0;
let absoluteAlphaError = 0;
let maximumAlphaError = 0;
let intersection = 0;
let union = 0;
for (let pixel = 0; pixel < authority.length; pixel++) {
  const offset = pixel * 4;
  const exportedAlpha = exported.data[offset + 3];
  if (exportedAlpha !== 0) {
    for (let channel = 0; channel < 3; channel++) {
      if (exported.data[offset + channel] !== source.data[offset + channel]) {
        visibleRgbDifferences++;
      }
    }
  }

  const error = Math.abs(exportedAlpha - authority[pixel]);
  absoluteAlphaError += error;
  maximumAlphaError = Math.max(maximumAlphaError, error);
  const actualForeground = exportedAlpha >= 128;
  const expectedForeground = authority[pixel] >= 128;
  if (actualForeground && expectedForeground) intersection++;
  if (actualForeground || expectedForeground) union++;
}

const alphaMae = absoluteAlphaError / authority.length;
const alphaIou128 = union === 0 ? 1 : intersection / union;
assert.equal(visibleRgbDifferences, 0, 'visible RGB differences');
assert.ok(alphaMae <= 0.25, `alpha MAE ${alphaMae} exceeds 0.25`);
assert.ok(alphaIou128 >= 0.998, `alpha IoU@128 ${alphaIou128} is below 0.998`);

console.log(
  JSON.stringify(
    {
      case: caseName,
      width: exported.width,
      height: exported.height,
      visibleRgbDifferences,
      alphaMae,
      alphaIou128,
      maximumAlphaError,
    },
    null,
    2,
  ),
);
console.log('output-parity-assert: PASS');
