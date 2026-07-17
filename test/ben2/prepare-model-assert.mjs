import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  MODEL_BYTES,
  MODEL_SHA256,
  MODEL_URL,
  prepareVerifiedFile,
} = require('../../lib/prepare-ben2-model.js');

assert.equal(MODEL_BYTES, 219121675);
assert.equal(
  MODEL_SHA256,
  'dfdc25f421f32a0d1268e0f2ff2153d340e8f1d52d3dd16f5dc33c1ce85cedf1',
);
assert.equal(
  MODEL_URL,
  'https://huggingface.co/onnx-community/BEN2-ONNX/resolve/c552aa82688edce09f0ac9d2e31ad53d9d629010/onnx/model_fp16.onnx',
);

const payload = new TextEncoder().encode('small verified model payload');
const expectedSha256 = createHash('sha256').update(payload).digest('hex');
const root = await mkdtemp(path.join(tmpdir(), 'squoosh-ben2-model-'));
let sequence = 0;

function response(body, init) {
  return new Response(body, init);
}

async function run(fetchImpl, overrides = {}) {
  const target = path.join(root, `case-${sequence++}`, 'model.onnx');
  const spec = {
    url: 'https://models.example.test/model.onnx',
    target,
    expectedBytes: payload.byteLength,
    expectedSha256,
    fetchImpl,
    ...overrides,
  };
  return { target, spec, result: prepareVerifiedFile(spec) };
}

async function assertCleanFailure(fetchImpl, pattern, overrides = {}) {
  const { target, result } = await run(fetchImpl, overrides);
  await assert.rejects(result, pattern);
  await assert.rejects(readFile(target), { code: 'ENOENT' });
  const entries = await readdir(path.dirname(target)).catch((error) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  assert.deepEqual(entries, [], 'failure must leave no canonical or temporary file');
}

try {
  {
    let fetches = 0;
    const target = path.join(root, `case-${sequence++}`, 'model.onnx');
    const spec = {
      url: 'https://models.example.test/model.onnx',
      target,
      expectedBytes: payload.byteLength,
      expectedSha256,
      fetchImpl: async () => {
        fetches++;
        throw new Error('verified reuse must not fetch');
      },
    };
    await resultSettled(spec, target, payload);
    assert.equal(fetches, 0);
  }

  {
    const requests = [];
    const { target, result } = await run(async (url, init) => {
      requests.push({ url: String(url), init });
      if (requests.length === 1) {
        return response(null, {
          status: 302,
          headers: { location: '../immutable/model.onnx' },
        });
      }
      return response(payload, { status: 200 });
    });
    assert.equal(await result, target);
    assert.deepEqual(new Uint8Array(await readFile(target)), payload);
    assert.deepEqual(
      requests.map(({ url }) => url),
      [
        'https://models.example.test/model.onnx',
        'https://models.example.test/immutable/model.onnx',
      ],
    );
    assert.ok(requests.every(({ init }) => init.redirect === 'manual'));
  }

  await assertCleanFailure(
    async () => response('unavailable', { status: 503 }),
    /HTTP 503/,
  );
  await assertCleanFailure(
    async () =>
      response(null, {
        status: 307,
        headers: { location: 'http://models.example.test/model.onnx' },
      }),
    /HTTPS/,
  );
  await assertCleanFailure(
    async () => response(payload.slice(0, -1), { status: 200 }),
    /expected byte count/,
  );
  await assertCleanFailure(
    async () =>
      response(new Uint8Array([...payload, 0]), {
        status: 200,
      }),
    /exceeds expected byte count/,
  );
  await assertCleanFailure(
    async () => response(payload, { status: 200 }),
    /SHA-256/,
    { expectedSha256: '0'.repeat(64) },
  );
  await assertCleanFailure(
    async () => response(null, { status: 302, headers: { location: '/again' } }),
    /redirect limit/,
  );
  await assertCleanFailure(
    async () => response(payload, { status: 200 }),
    /HTTPS/,
    { url: 'http://models.example.test/model.onnx' },
  );

  {
    const controller = new AbortController();
    const body = new ReadableStream({
      pull(streamController) {
        streamController.enqueue(payload.slice(0, 2));
        controller.abort(new DOMException('test abort', 'AbortError'));
      },
    });
    await assertCleanFailure(
      async () => response(body, { status: 200 }),
      (error) => error.name === 'AbortError',
      { signal: controller.signal },
    );
  }

  {
    const target = path.join(root, `case-${sequence++}`, 'model.onnx');
    const { mkdir } = await import('node:fs/promises');
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, 'bad canonical bytes');
    await assert.rejects(
      prepareVerifiedFile({
        url: 'https://models.example.test/model.onnx',
        target,
        expectedBytes: payload.byteLength,
        expectedSha256,
        fetchImpl: async () => {
          throw new Error('network failed');
        },
      }),
      /network failed/,
    );
    await assert.rejects(readFile(target), { code: 'ENOENT' });
  }
} finally {
  await rm(root, { recursive: true, force: true });
}

async function resultSettled(spec, target, bytes) {
  const { mkdir } = await import('node:fs/promises');
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes);
  assert.equal(await prepareVerifiedFile(spec), target);
}

console.log('prepare-model-assert: PASS');
