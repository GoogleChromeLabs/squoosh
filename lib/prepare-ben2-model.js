const { createHash, randomBytes } = require('crypto');
const { createReadStream, promises: fs } = require('fs');
const path = require('path');

const MODEL_URL =
  'https://huggingface.co/onnx-community/BEN2-ONNX/resolve/c552aa82688edce09f0ac9d2e31ad53d9d629010/onnx/model_fp16.onnx';
const MODEL_BYTES = 219121675;
const MODEL_SHA256 =
  'dfdc25f421f32a0d1268e0f2ff2153d340e8f1d52d3dd16f5dc33c1ce85cedf1';
const MODEL_PATH = path.join(
  __dirname,
  '..',
  '.tmp',
  'ben2',
  'model_fp16.onnx',
);
const MAX_REDIRECTS = 5;

function throwIfAborted(signal) {
  if (!signal?.aborted) return;
  if (signal.reason !== undefined) throw signal.reason;
  const error = new Error('The operation was aborted');
  error.name = 'AbortError';
  throw error;
}

async function fileMatches(target, expectedBytes, expectedSha256) {
  let stat;
  try {
    stat = await fs.stat(target);
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
  if (!stat.isFile() || stat.size !== expectedBytes) return false;

  const hash = createHash('sha256');
  for await (const chunk of createReadStream(target)) hash.update(chunk);
  return hash.digest('hex') === expectedSha256;
}

async function fetchHttps(url, fetchImpl, signal, redirects = 0) {
  throwIfAborted(signal);
  const parsedUrl = new URL(url);
  if (parsedUrl.protocol !== 'https:') {
    throw new Error('BEN2 model URL and redirects must use HTTPS');
  }

  const response = await fetchImpl(parsedUrl.href, {
    redirect: 'manual',
    signal,
  });
  if (response.status >= 300 && response.status < 400) {
    if (redirects >= MAX_REDIRECTS) {
      throw new Error('BEN2 model download exceeded redirect limit');
    }
    const location = response.headers.get('location');
    if (!location) {
      throw new Error('BEN2 model download redirect has no location');
    }
    return fetchHttps(
      new URL(location, parsedUrl).href,
      fetchImpl,
      signal,
      redirects + 1,
    );
  }
  if (!response.ok) {
    throw new Error(`BEN2 model download failed with HTTP ${response.status}`);
  }
  if (!response.body) {
    throw new Error('BEN2 model download has no response body');
  }
  return response;
}

async function writeAll(handle, chunk) {
  let offset = 0;
  while (offset < chunk.byteLength) {
    const { bytesWritten } = await handle.write(
      chunk,
      offset,
      chunk.byteLength - offset,
      null,
    );
    if (bytesWritten === 0) {
      throw new Error('BEN2 model download could not write temporary file');
    }
    offset += bytesWritten;
  }
}

async function prepareVerifiedFile({
  url,
  target,
  expectedBytes,
  expectedSha256,
  fetchImpl = globalThis.fetch,
  signal,
}) {
  if (typeof fetchImpl !== 'function') {
    throw new TypeError('A fetch implementation is required');
  }
  if (!Number.isSafeInteger(expectedBytes) || expectedBytes < 0) {
    throw new TypeError('expectedBytes must be a non-negative safe integer');
  }
  if (!/^[0-9a-f]{64}$/.test(expectedSha256)) {
    throw new TypeError('expectedSha256 must be a lowercase SHA-256 digest');
  }

  throwIfAborted(signal);
  try {
    if (await fileMatches(target, expectedBytes, expectedSha256)) return target;
  } catch (error) {
    await fs.rm(target, { force: true });
    throw error;
  }

  await fs.rm(target, { force: true });
  await fs.mkdir(path.dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.${randomBytes(8).toString(
    'hex',
  )}.tmp`;
  let handle;

  try {
    const response = await fetchHttps(url, fetchImpl, signal);
    handle = await fs.open(temporary, 'wx');
    const hash = createHash('sha256');
    let bytes = 0;

    for await (const value of response.body) {
      throwIfAborted(signal);
      const chunk = value instanceof Uint8Array ? value : new Uint8Array(value);
      bytes += chunk.byteLength;
      if (bytes > expectedBytes) {
        throw new Error('BEN2 model download exceeds expected byte count');
      }
      hash.update(chunk);
      await writeAll(handle, chunk);
    }
    throwIfAborted(signal);

    if (bytes !== expectedBytes) {
      throw new Error(
        `BEN2 model download has ${bytes} bytes; expected byte count is ${expectedBytes}`,
      );
    }
    if (hash.digest('hex') !== expectedSha256) {
      throw new Error('BEN2 model download SHA-256 does not match');
    }

    await handle.close();
    handle = undefined;
    await fs.rename(temporary, target);
    return target;
  } catch (error) {
    if (handle) await handle.close().catch(() => {});
    await fs.rm(temporary, { force: true });
    await fs.rm(target, { force: true });
    throw error;
  }
}

async function prepareBen2Model({ signal } = {}) {
  const target = await prepareVerifiedFile({
    url: MODEL_URL,
    target: MODEL_PATH,
    expectedBytes: MODEL_BYTES,
    expectedSha256: MODEL_SHA256,
    fetchImpl: globalThis.fetch,
    signal,
  });
  console.log('BEN2 model verified');
  return target;
}

module.exports = {
  MODEL_BYTES,
  MODEL_PATH,
  MODEL_SHA256,
  MODEL_URL,
  prepareBen2Model,
  prepareVerifiedFile,
};

if (require.main === module) {
  prepareBen2Model().catch((error) => {
    console.error(`BEN2 model preparation failed: ${error.message}`);
    process.exitCode = 1;
  });
}
