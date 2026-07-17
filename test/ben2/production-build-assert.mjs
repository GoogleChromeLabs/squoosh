#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const buildArg = process.argv[2];
assert.ok(buildArg, 'usage: production-build-assert.mjs <build-directory>');
const buildRoot = path.resolve(root, buildArg);
assert.ok((await stat(buildRoot)).isDirectory(), `${buildArg} must be a directory`);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolute)));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

const relative = (file) => path.relative(buildRoot, file).split(path.sep).join('/');
const publicPath = (file) => `/${relative(file)}`;
const buildFiles = await walk(buildRoot);

function oneAsset(pattern, role) {
  const matches = buildFiles.filter((file) => pattern.test(relative(file)));
  assert.equal(
    matches.length,
    1,
    `expected exactly one ${role}, found ${matches.map(relative).join(', ') || 'none'}`,
  );
  return matches[0];
}

async function assertIdentity(file, { bytes, sha256 }, role) {
  const data = await readFile(file);
  assert.equal(data.byteLength, bytes, `${role} byte length`);
  assert.equal(
    createHash('sha256').update(data).digest('hex'),
    sha256,
    `${role} SHA-256`,
  );
}

const assets = {
  features_worker: oneAsset(/^c\/features-worker-[^.]+\.js$/, 'generated feature worker'),
  model: oneAsset(/^c\/model_fp16-[^.]+\.onnx$/, 'BEN2 model'),
  ort_asyncify_mjs: oneAsset(
    /^c\/ort-wasm-simd-threaded\.asyncify-[^.]+\.mjs$/,
    'stock ORT asyncify MJS',
  ),
  ort_asyncify_wasm: oneAsset(
    /^c\/ort-wasm-simd-threaded\.asyncify-[^.]+\.wasm$/,
    'stock ORT asyncify WASM',
  ),
  png_decoder_js: oneAsset(/^c\/squoosh_png-[^.]+\.js$/, 'PNG decoder JS'),
  png_decoder_wasm: oneAsset(
    /^c\/squoosh_png_bg-[^.]+\.wasm$/,
    'PNG decoder WASM',
  ),
};

assert.equal(
  new Set(Object.values(assets).map(publicPath)).size,
  6,
  'the BEN2 lazy inventory must contain six unique assets',
);

await assertIdentity(
  assets.model,
  {
    bytes: 219_121_675,
    sha256: 'dfdc25f421f32a0d1268e0f2ff2153d340e8f1d52d3dd16f5dc33c1ce85cedf1',
  },
  'BEN2 model',
);
await assertIdentity(
  assets.ort_asyncify_mjs,
  {
    bytes: 47_507,
    sha256: '7236653b8565da4046e459cd0e274123419a1d9f1f8f18fd36c28058346ca655',
  },
  'stock ORT asyncify MJS',
);
await assertIdentity(
  assets.ort_asyncify_wasm,
  {
    bytes: 24_254_953,
    sha256: '7e83cd6cee77e478bc96a7e91b198144fb5e4126287daf1f9b54bb195ebcd55a',
  },
  'stock ORT asyncify WASM',
);
await assertIdentity(
  assets.png_decoder_js,
  {
    bytes: 2_432,
    sha256: 'e57ac24813287fd6276ea1f256b3ffc93dea1bc71b077f030311604e9dfcacac',
  },
  'PNG decoder JS',
);
await assertIdentity(
  assets.png_decoder_wasm,
  {
    bytes: 123_698,
    sha256: '110265ebf5133af5c0dd3eadbcdf2ed46f31e97d4a413a599c999c55d1437cc7',
  },
  'PNG decoder WASM',
);

const serviceWorker = await readFile(
  oneAsset(/^serviceworker\.js$/, 'service worker'),
  'utf8',
);
for (const [role, file] of Object.entries(assets)) {
  assert.ok(serviceWorker.includes(role), `service worker must retain ${role} role`);
  assert.ok(
    serviceWorker.includes(publicPath(file)),
    `service worker must link ${role} to its emitted path`,
  );
}
assert.ok(serviceWorker.includes('/manifest.json'), 'manifest must be in the app shell');
assert.ok(
  buildFiles.some((file) => relative(file) === 'manifest.json'),
  'manifest.json must be emitted',
);

const featureWorker = await readFile(assets.features_worker, 'utf8');
for (const role of [
  'model',
  'ort_asyncify_mjs',
  'ort_asyncify_wasm',
  'png_decoder_js',
]) {
  assert.ok(
    featureWorker.includes(path.basename(assets[role])),
    `generated feature worker must link ${role}`,
  );
}
assert.match(featureWorker, /pngDecode\s*:/, 'generated pngDecode API');
assert.match(featureWorker, /ben2\s*:/, 'generated ben2 API');
const pngDecoder = await readFile(assets.png_decoder_js, 'utf8');
assert.ok(
  pngDecoder.includes(path.basename(assets.png_decoder_wasm)),
  'PNG decoder JS must link its WASM',
);
const compressChunk = await readFile(
  oneAsset(/^c\/Compress-[^.]+\.js$/, 'Compress application chunk'),
  'utf8',
);
assert.ok(
  compressChunk.includes(path.basename(assets.features_worker)),
  'normal Compress UI must link the generated worker',
);

const eagerFiles = [
  oneAsset(/^index\.html$/, 'application HTML'),
  oneAsset(/^c\/initial-app-[^.]+\.js$/, 'initial application chunk'),
];
const heavyLazyRoles = [
  'model',
  'ort_asyncify_mjs',
  'ort_asyncify_wasm',
  'png_decoder_js',
  'png_decoder_wasm',
];
for (const eagerFile of eagerFiles) {
  const text = await readFile(eagerFile, 'utf8');
  for (const role of heavyLazyRoles) {
    assert.ok(
      !text.includes(path.basename(assets[role])),
      `${role} must not be referenced by ${relative(eagerFile)}`,
    );
  }
}

const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const packageLock = JSON.parse(
  await readFile(path.join(root, 'package-lock.json'), 'utf8'),
);
assert.equal(packageJson.dependencies?.['onnxruntime-web'], '1.27.0');
assert.equal(
  packageLock.packages?.['']?.dependencies?.['onnxruntime-web'],
  '1.27.0',
);
assert.equal(
  packageLock.packages?.['node_modules/onnxruntime-web']?.version,
  '1.27.0',
);
assert.equal(packageLock.dependencies?.['onnxruntime-web']?.version, '1.27.0');

const sourceExtensions = new Set(['.js', '.ts', '.tsx', '.ejs']);
const runtimeSourceFiles = [
  ...(await walk(path.join(root, 'src'))),
  ...(await walk(path.join(root, 'lib'))),
  path.join(root, 'rollup.config.js'),
  path.join(root, 'missing-types.d.ts'),
].filter((file) => sourceExtensions.has(path.extname(file)));
const runtimeSource = (
  await Promise.all(runtimeSourceFiles.map((file) => readFile(file, 'utf8')))
).join('\n');
const ben2RuntimeSource = (
  await Promise.all(
    runtimeSourceFiles
      .filter((file) => /ben2|Compress|worker-bridge|sw(?:\/|\\)/i.test(file))
      .map((file) => readFile(file, 'utf8')),
  )
).join('\n');

const sourceResiduePatterns = [
  [/BEN2_ACCEPTANCE|__BEN2_ACCEPTANCE__/, 'BEN2 acceptance replacement/declaration'],
  [/BroadcastChannel/, 'BroadcastChannel'],
  [/__squooshBen2/, 'BEN2 window global'],
  [/\?ben2(?:\b|=)/i, 'BEN2 query activation'],
  [/(?:searchParams)?\.has\(\s*['"]ben2['"]\s*\)/, 'BEN2 searchParams fallback'],
  [/ben2SpikeEnabled/, 'BEN2 spike flag'],
  [/ben2-(?:acceptance|cancellation-audit)|ben2Acceptance|ben2CancellationAudit/i, 'BEN2 acceptance/audit module'],
  [/\b(?:Netlify|spike)\b/i, 'Netlify/spike product wording'],
];
for (const [pattern, description] of sourceResiduePatterns) {
  assert.doesNotMatch(ben2RuntimeSource, pattern, `source residue: ${description}`);
}
assert.doesNotMatch(
  runtimeSource,
  /BEN2_ACCEPTANCE|__BEN2_ACCEPTANCE__|BroadcastChannel|__squooshBen2|ben2SpikeEnabled|ben2-(?:acceptance|cancellation-audit)|ben2Acceptance|ben2CancellationAudit/i,
  'acceptance/query/audit machinery must be absent from runtime source',
);
assert.doesNotMatch(
  await readFile(path.join(root, 'rollup.config.js'), 'utf8'),
  /BEN2_ACCEPTANCE|__BEN2_ACCEPTANCE__/,
  'Rollup must not replace BEN2 acceptance state',
);
assert.match(
  runtimeSource,
  /function ben2IsEnabled\([^)]*\)[^{]*{\s*return preprocessorState\.ben2\.enabled;\s*}/s,
  'ben2IsEnabled must depend only on preprocessor state',
);
assert.doesNotMatch(
  runtimeSource,
  /(?:ort\.env|env)\.logLevel\s*=|logSeverityLevel|logVerbosityLevel/i,
  'verbose ORT settings must be absent',
);
assert.doesNotMatch(
  await readFile(
    path.join(root, 'src/features/preprocessors/ben2/worker/ben2.ts'),
    'utf8',
  ),
  /console\.(?:log|debug|info)\(/,
  'BEN2 runtime must not emit verbose logs',
);
assert.doesNotMatch(
  runtimeSource,
  /executionProviders\s*:\s*\[\s*['"]wasm['"]/,
  'WASM execution provider must be absent',
);
const srcOnly = (
  await Promise.all(
    (await walk(path.join(root, 'src')))
      .filter((file) => sourceExtensions.has(path.extname(file)))
      .map((file) => readFile(file, 'utf8')),
  )
).join('\n');
assert.doesNotMatch(
  srcOnly,
  /https?:\/\/(?:huggingface\.co|hf\.co)\//i,
  'runtime source must not contain a remote model URL',
);
assert.doesNotMatch(
  runtimeSource,
  /\/tmp\/squoosh|(?:^|["'])evidence\//im,
  'runtime source must not contain evidence paths',
);
assert.doesNotMatch(
  await readFile(path.join(root, 'missing-types.d.ts'), 'utf8'),
  /__BEN2_ACCEPTANCE__|BEN2_ACCEPTANCE/,
  'root types must not declare BEN2 acceptance state',
);

const buildTextFiles = buildFiles.filter((file) =>
  new Set(['.js', '.mjs', '.html', '.json']).has(path.extname(file)),
);
const buildText = (
  await Promise.all(buildTextFiles.map((file) => readFile(file, 'utf8')))
).join('\n');
const buildResiduePatterns = [
  [/BEN2_ACCEPTANCE|__BEN2_ACCEPTANCE__/i, 'BEN2 acceptance state'],
  [/BroadcastChannel/, 'BroadcastChannel'],
  [/__squooshBen2/, 'BEN2 window global'],
  [/\?ben2(?:\b|=)/i, 'BEN2 query activation'],
  [/(?:searchParams)?\.has\(\s*['"]ben2['"]\s*\)/, 'BEN2 searchParams fallback'],
  [/ben2SpikeEnabled/i, 'BEN2 spike flag'],
  [/ben2[-_ ]?(?:acceptance|audit)|squoosh-ben2-acceptance|auditJob/i, 'BEN2 acceptance/audit module'],
  [/\.logLevel\s*=\s*['"]verbose['"]|logSeverityLevel\s*:\s*0|logVerbosityLevel/i, 'verbose ORT configuration'],
  [/executionProviders\s*:\s*\[\s*['"]wasm['"]/i, 'WASM execution provider'],
  [/https?:\/\/(?:huggingface\.co|hf\.co)\//i, 'remote model runtime URL'],
  [/(?:\/tmp\/|\.tmp\/|evidence\/)/i, 'evidence/temp path'],
  [/\b(?:Netlify|spike)\b/i, 'Netlify/spike product wording'],
];
for (const [pattern, description] of buildResiduePatterns) {
  assert.doesNotMatch(buildText, pattern, `production residue: ${description}`);
}

console.log('PASS BEN2 production asset, lazy-linkage, and stripping assertions');
