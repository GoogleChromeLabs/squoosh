import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

class ImageDataShim {
  constructor(data, width, height) {
    this.data = data;
    this.width = width;
    this.height = height;
  }
}
globalThis.ImageData = ImageDataShim;

async function importGeneratedModule(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  return import(
    `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
  );
}

const [oxipng, png, oxipngWasm, pngWasm] = await Promise.all([
  importGeneratedModule('../../codecs/oxipng/pkg/squoosh_oxipng.js'),
  importGeneratedModule('../../codecs/png/pkg/squoosh_png.js'),
  readFile(
    new URL('../../codecs/oxipng/pkg/squoosh_oxipng_bg.wasm', import.meta.url),
  ),
  readFile(
    new URL('../../codecs/png/pkg/squoosh_png_bg.wasm', import.meta.url),
  ),
]);

await Promise.all([oxipng.default(oxipngWasm), png.default(pngWasm)]);

const width = 2;
const height = 2;
const source = new Uint8ClampedArray([
  3, 5, 7, 0, 11, 13, 17, 31, 19, 23, 29, 128, 37, 41, 43, 255,
]);
const encoded = oxipng.optimise(source, width, height, 2, false);
const decoded = png.decode(encoded);

assert.equal(decoded.width, width);
assert.equal(decoded.height, height);
for (let offset = 0; offset < source.length; offset += 4) {
  assert.equal(
    decoded.data[offset + 3],
    source[offset + 3],
    `alpha at pixel ${offset / 4}`,
  );
  if (source[offset + 3] === 0) continue;
  assert.deepEqual(
    [...decoded.data.slice(offset, offset + 3)],
    [...source.slice(offset, offset + 3)],
    `visible RGB at pixel ${offset / 4}`,
  );
}

console.log('BEN2 stock OxiPNG export contract assertion passed');
