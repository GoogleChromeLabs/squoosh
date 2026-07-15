/*
 * BEN2 Netlify deploy-preview spike only. This intentionally acquires a
 * pinned model at build time; it is not a production distribution mechanism.
 */
const { createHash } = require('crypto');
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

async function isVerifiedModel(filePath) {
  let stat;
  try {
    stat = await fs.stat(filePath);
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
  if (!stat.isFile() || stat.size !== MODEL_BYTES) return false;

  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest('hex') === MODEL_SHA256;
}

async function fetchPinned(url, redirects = 0, signal) {
  signal?.throwIfAborted?.();
  const response = await fetch(url, { redirect: 'manual', signal });
  if (response.status >= 300 && response.status < 400) {
    if (redirects === MAX_REDIRECTS)
      throw new Error('BEN2 model download exceeded redirect limit');
    const location = response.headers.get('location');
    if (!location)
      throw new Error('BEN2 model download redirect has no location');
    const nextUrl = new URL(location, url);
    if (nextUrl.protocol !== 'https:')
      throw new Error('BEN2 model download redirect is not HTTPS');
    return fetchPinned(nextUrl, redirects + 1, signal);
  }
  if (!response.ok)
    throw new Error(`BEN2 model download failed with HTTP ${response.status}`);
  if (!response.body)
    throw new Error('BEN2 model download has no response body');
  return response;
}

async function downloadVerifiedModel(target, signal) {
  const temporary = `${target}.${process.pid}.${Date.now()}.tmp`;
  try {
    const response = await fetchPinned(MODEL_URL, 0, signal);
    const handle = await fs.open(temporary, 'wx');
    const hash = createHash('sha256');
    let bytes = 0;
    try {
      for await (const chunk of response.body) {
        signal?.throwIfAborted?.();
        bytes += chunk.byteLength;
        if (bytes > MODEL_BYTES)
          throw new Error('BEN2 model download exceeds expected byte count');
        hash.update(chunk);
        await handle.write(chunk);
      }
    } finally {
      await handle.close();
    }
    if (bytes !== MODEL_BYTES)
      throw new Error(
        `BEN2 model download has ${bytes} bytes; expected ${MODEL_BYTES}`,
      );
    if (hash.digest('hex') !== MODEL_SHA256)
      throw new Error('BEN2 model download SHA-256 does not match');
    await fs.rename(temporary, target);
  } catch (error) {
    await fs.rm(temporary, { force: true });
    throw error;
  }
}

async function prepareBen2Model({ signal } = {}) {
  if (await isVerifiedModel(MODEL_PATH)) {
    console.log('BEN2 spike model already verified');
    return MODEL_PATH;
  }

  await fs.mkdir(path.dirname(MODEL_PATH), { recursive: true });
  // Never leave a known-bad canonical file visible if download/verification fails.
  await fs.rm(MODEL_PATH, { force: true });
  console.log('BEN2 spike model download and verification started');
  await downloadVerifiedModel(MODEL_PATH, signal);
  console.log('BEN2 spike model download and verification complete');
  return MODEL_PATH;
}

module.exports = {
  MODEL_BYTES,
  MODEL_PATH,
  MODEL_SHA256,
  MODEL_URL,
  prepareBen2Model,
};

if (require.main === module) {
  prepareBen2Model().catch((error) => {
    console.error(`BEN2 spike model preparation failed: ${error.message}`);
    process.exitCode = 1;
  });
}
