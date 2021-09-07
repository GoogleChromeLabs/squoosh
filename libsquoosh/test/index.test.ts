import * as path from 'path';
import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { ImagePool } from '..';

let imagePool: ImagePool;

test.after.each(async () => {
  if (imagePool) {
    try {
      await imagePool.close();
    } catch (e) {}
  }
  imagePool = undefined;
});

test('smoke test', async () => {
  imagePool = new ImagePool(1);

  const imagePath = path.resolve(__dirname, '../../icon-large-maskable.png');
  const image = imagePool.ingestImage(imagePath);

  const { bitmap } = await image.decoded;
  assert.equal(bitmap.width, 1024);

  await image.preprocess({
    resize: {
      enabled: true,
      width: 100,
    },
  });

  await image.encode({
    mozjpeg: {},
  });

  const { size } = await image.encodedWith.mozjpeg;
  // resulting image is 1554b
  assert.ok(size > 500);
  assert.ok(size < 5000);
});

test.run();
