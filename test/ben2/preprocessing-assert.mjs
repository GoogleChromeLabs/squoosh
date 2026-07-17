import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

class TestImageData {
  constructor(data, width, height) {
    assert.equal(data.length, width * height * 4);
    this.data = data;
    this.width = width;
    this.height = height;
  }
}
globalThis.ImageData = TestImageData;

async function loadPreprocessing() {
  let source = await readFile(
    new URL(
      '../../src/features/preprocessors/ben2/shared/preprocessing.ts',
      import.meta.url,
    ),
    'utf8',
  );
  source = source
    .replaceAll(': Uint8Array | Uint8ClampedArray', '')
    .replaceAll(': Uint8ClampedArray', '')
    .replaceAll(': Float32Array', '')
    .replaceAll(': ImageData', '')
    .replaceAll(': number', '')
    .replaceAll(': string', '')
    .replaceAll(': void', '');
  assert.doesNotMatch(source, /interface |\sas\s|:\s*[A-Z][A-Za-z]/);
  return import(
    `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
  );
}

const {
  applyMatte,
  makeNormalizedInput,
  makeResizedMatte,
  resizeU8AsymmetricZero,
} = await loadPreprocessing();

assert.deepEqual(
  resizeU8AsymmetricZero(new Uint8Array([100]), 1, 1, 2, 2, 1),
  new Uint8ClampedArray([100, 50, 50, 25]),
  '1x1 resize must include the zero-valued trailing neighbours',
);
assert.deepEqual(
  resizeU8AsymmetricZero(new Uint8Array([100, 200]), 1, 2, 2, 2, 1),
  new Uint8ClampedArray([100, 50, 200, 100]),
  '1xN resize',
);
assert.deepEqual(
  resizeU8AsymmetricZero(new Uint8Array([100, 200]), 2, 1, 2, 2, 1),
  new Uint8ClampedArray([100, 200, 50, 100]),
  'Nx1 resize',
);
assert.deepEqual(
  resizeU8AsymmetricZero(new Uint8Array([100, 200]), 2, 1, 4, 1, 1),
  new Uint8ClampedArray([100, 150, 200, 100]),
  'asymmetric coordinates must retain the trailing zero border',
);
assert.deepEqual(
  resizeU8AsymmetricZero(new Uint8Array([1, 2, 3, 4]), 2, 2, 2, 2, 1),
  new Uint8ClampedArray([1, 2, 3, 4]),
  'same-size resize',
);
assert.deepEqual(
  resizeU8AsymmetricZero(new Uint8Array([10, 20]), 1, 1, 2, 1, 2),
  new Uint8ClampedArray([10, 20, 5, 10]),
  'channels are resized independently',
);
for (const args of [
  [new Uint8Array(), 0, 1, 1, 1, 1],
  [new Uint8Array(), 1, -1, 1, 1, 1],
  [new Uint8Array(), 1, 1, 1.5, 1, 1],
  [new Uint8Array([1]), 1, 1, 1, 1, 2],
]) {
  assert.throws(() => resizeU8AsymmetricZero(...args), RangeError);
}

const normalized = makeNormalizedInput(
  new Uint8ClampedArray([0, 127, 255, 3]),
  1,
  1,
  1,
);
const expectedNormalized = [
  (0 / 255 - 0.485) / 0.229,
  (127 / 255 - 0.456) / 0.224,
  (255 / 255 - 0.406) / 0.225,
];
assert.equal(normalized.length, 3);
for (let index = 0; index < normalized.length; index++) {
  assert.ok(Math.abs(normalized[index] - expectedNormalized[index]) < 1e-6);
}

assert.deepEqual(
  makeResizedMatte(new Float32Array([0.5]), 1, 1, 1),
  new Uint8ClampedArray([127]),
  'probabilities are clamped and truncated before resize',
);
assert.deepEqual(
  makeResizedMatte(
    new Float32Array([0, 1, -0.000009, 1.000009]),
    2,
    2,
    2,
  ),
  new Uint8ClampedArray([0, 255, 0, 255]),
  'values inside probability tolerance must not be sigmoid transformed',
);
assert.deepEqual(
  makeResizedMatte(new Float32Array([-1, 0, 1, 2]), 2, 2, 2),
  new Uint8ClampedArray([68, 127, 186, 224]),
  'one out-of-probability value selects sigmoid for the complete matte',
);
assert.throws(
  () => makeResizedMatte(new Float32Array(3), 2, 2, 2),
  /raw matte length/,
);

const source = new ImageData(
  new Uint8ClampedArray([
    1, 2, 3, 0, 4, 5, 6, 255, 7, 8, 9, 17, 10, 11, 12, 63,
  ]),
  2,
  2,
);
const composed = applyMatte(
  source,
  new Float32Array([0, 0.25, 0.5, 1]),
  2,
);
assert.equal(composed.width, 2);
assert.equal(composed.height, 2);
assert.deepEqual(
  composed.data,
  new Uint8ClampedArray([
    1, 2, 3, 0, 4, 5, 6, 63, 7, 8, 9, 127, 10, 11, 12, 255,
  ]),
  'composition must preserve all source RGB and replace, not multiply, alpha',
);
assert.deepEqual(source.data.slice(0, 4), new Uint8ClampedArray([1, 2, 3, 0]));

console.log('preprocessing-assert: PASS');
