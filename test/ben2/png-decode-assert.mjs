import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

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

console.log('png-decode-assert: PASS');
