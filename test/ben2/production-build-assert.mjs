#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const buildArg = process.argv[2];
assert.ok(buildArg, 'usage: production-build-assert.mjs <build-directory>');
const buildRoot = path.resolve(root, buildArg);
assert.ok(
  (await stat(buildRoot)).isDirectory(),
  `${buildArg} must be a directory`,
);

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

const relative = (file) =>
  path.relative(buildRoot, file).split(path.sep).join('/');
const publicPath = (file) => `/${relative(file)}`;
const buildFiles = await walk(buildRoot);

function oneAsset(pattern, role) {
  const matches = buildFiles.filter((file) => pattern.test(relative(file)));
  assert.equal(
    matches.length,
    1,
    `expected exactly one ${role}, found ${
      matches.map(relative).join(', ') || 'none'
    }`,
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
  features_worker: oneAsset(
    /^c\/features-worker-[^.]+\.js$/,
    'generated feature worker',
  ),
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
  assert.ok(
    serviceWorker.includes(role),
    `service worker must retain ${role} role`,
  );
  assert.ok(
    serviceWorker.includes(publicPath(file)),
    `service worker must link ${role} to its emitted path`,
  );
}
assert.ok(
  serviceWorker.includes('/manifest.json'),
  'manifest must be in the app shell',
);
assert.ok(
  !serviceWorker.includes('ben2-download-model'),
  'production SW must not retain the old model command',
);
assert.ok(
  serviceWorker.includes('squoosh-ben2-model-v1'),
  'production SW must preserve the dedicated model cache',
);
assert.ok(
  serviceWorker.includes('X-Squoosh-BEN2-Download'),
  'production SW must recognize the fixed explicit request',
);
assert.ok(
  serviceWorker.includes('BEN2 model is not cached'),
  'production model fetch route must retain its cache-only miss',
);
assert.ok(
  buildFiles.some((file) => relative(file) === 'manifest.json'),
  'manifest.json must be emitted',
);

const featureWorker = await readFile(assets.features_worker, 'utf8');
for (const role of ['model', 'ort_asyncify_mjs', 'ort_asyncify_wasm']) {
  assert.ok(
    featureWorker.includes(path.basename(assets[role])),
    `generated feature worker must link ${role}`,
  );
}
const pngDecoderSpecifier = `./${path.basename(assets.png_decoder_js, '.js')}`;
const escapedPngDecoderSpecifier = JSON.stringify(pngDecoderSpecifier).replace(
  /[.*+?^${}()|[\]\\]/g,
  '\\$&',
);
const pngDecoderAmdEdges = [
  ...featureWorker.matchAll(
    new RegExp(`\\b[\\w$]+\\(\\s*(${escapedPngDecoderSpecifier})\\s*\\)`, 'g'),
  ),
];
assert.equal(
  pngDecoderAmdEdges.length,
  1,
  'generated feature worker must have exactly one PNG decoder AMD edge',
);
const parsedPngDecoderSpecifier = JSON.parse(pngDecoderAmdEdges[0][1]);
assert.equal(
  parsedPngDecoderSpecifier,
  pngDecoderSpecifier,
  'generated PNG decoder AMD edge must use the emitted PNG decoder stem',
);
assert.equal(
  new URL(
    `${parsedPngDecoderSpecifier}.js`,
    `https://build.test${publicPath(assets.features_worker)}`,
  ).pathname,
  publicPath(assets.png_decoder_js),
  'generated PNG decoder AMD specifier must resolve to emitted PNG decoder JS',
);
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
for (const copy of [
  'Remove background',
  'BEN2 Neural Network is cached.',
  'BEN2 Neural Network is not cached.',
  'download (',
]) {
  assert.ok(compressChunk.includes(copy), `Compress UI must contain ${copy}`);
}
assert.ok(!compressChunk.includes('Remove background (BEN2)'));

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

const packageJson = JSON.parse(
  await readFile(path.join(root, 'package.json'), 'utf8'),
);
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

const ben2ProductSourcePaths = [
  'lib/omt.ejs',
  'lib/prepare-ben2-model.js',
  'missing-types.d.ts',
  'rollup.config.js',
  'src/client/lazy-app/Compress/Options/index.tsx',
  'src/client/lazy-app/Compress/ben2-cache-lifecycle.ts',
  'src/client/lazy-app/Compress/ben2-capability.ts',
  'src/client/lazy-app/Compress/ben2-processing.ts',
  'src/client/lazy-app/Compress/index.tsx',
  'src/client/lazy-app/Compress/main-job.ts',
  'src/client/lazy-app/Compress/Results/pretty-bytes.ts',
  'src/client/lazy-app/sw-bridge/index.ts',
  'src/client/lazy-app/worker-bridge/index.ts',
  'src/features/decoders/png/worker/pngDecode.ts',
  'src/features/processors/ben2/shared/meta.ts',
  'src/features/processors/ben2/shared/model-cache.ts',
  'src/features/processors/ben2/shared/preprocessing.ts',
  'src/features/processors/ben2/worker/ben2.ts',
  'src/features/processors/ben2/worker/missing-types.d.ts',
  'src/sw/index.ts',
  'src/sw/missing-types.d.ts',
  'src/sw/to-cache.ts',
  'src/sw/util.ts',
];
assert.equal(
  new Set(ben2ProductSourcePaths).size,
  ben2ProductSourcePaths.length,
  'BEN2 product source inventory must not contain duplicate paths',
);
const ben2ProductSources = new Map(
  await Promise.all(
    ben2ProductSourcePaths.map(async (sourcePath) => [
      sourcePath,
      await readFile(path.join(root, sourcePath), 'utf8'),
    ]),
  ),
);

function assertNoSourceResidue(sources, patterns, scope) {
  for (const [sourcePath, source] of sources) {
    for (const [pattern, description] of patterns) {
      assert.doesNotMatch(
        source,
        pattern,
        `${scope} (${sourcePath}): ${description}`,
      );
    }
  }
}

const legacyBen2QueryTransport = /\?ben2(?:\b|=)/i;
assert.match(
  '?ben2=model',
  legacyBen2QueryTransport,
  'legacy remote query transport remains rejected',
);
assert.doesNotMatch(
  '?model-validation-staging',
  legacyBen2QueryTransport,
  'neutral internal staging is not legacy query transport',
);

const sourceWiringResiduePatterns = [
  [legacyBen2QueryTransport, 'legacy BEN2 query transport'],
  [
    /\b(?:BEN2_ACCEPTANCE|__BEN2_ACCEPTANCE__)\b/,
    'acceptance build flag or replacement',
  ],
  [/\b__squooshBen2[\w$]*\b/, 'acceptance/audit window global'],
  [
    /\.\s*searchParams\s*\.\s*(?:has|get)\s*\(\s*['"]ben2(?:-(?:acceptance|cancellation-audit|audit))?['"]\s*\)/i,
    'BEN2 URL.searchParams activation',
  ],
  [
    /\bnew\s+URLSearchParams\s*\([^)]*\)\s*\.\s*(?:has|get)\s*\(\s*['"]ben2['"]\s*\)/i,
    'BEN2 URLSearchParams activation',
  ],
  [
    /\b(?:window\s*\.\s*)?location\s*\.\s*(?:search|href)\s*\.\s*(?:includes|startsWith)\s*\(\s*['"]\?ben2(?:[=&][^'"]*)?['"]\s*\)/i,
    'BEN2 location query activation',
  ],
  [
    /\bnew\s+BroadcastChannel\s*\(\s*(['"`])[^'"`]*ben2[^'"`]*\1\s*\)/i,
    'BEN2 BroadcastChannel construction',
  ],
  [
    /\b(?:squoosh-)?ben2-(?:acceptance|cancellation-audit|audit)(?:-[a-z0-9-]+)?\b/i,
    'acceptance/audit module or channel identifier',
  ],
  [
    /\bben2(?:Acceptance|CancellationAudit|Audit)[\w$]*\b/,
    'acceptance/audit call or identifier',
  ],
  [/\bben2SpikeEnabled\b/, 'query-gated spike flag'],
  [
    /\bconsole\.(?:log|debug|info)\s*\(\s*['"`][^'"`]*\bBEN2\b[^'"`]*\bspike\b/i,
    'BEN2 spike diagnostic call',
  ],
  [
    /\bprocess\s*\.\s*env\s*(?:\.\s*(?:NETLIFY|CONTEXT|DEPLOY_ID|DEPLOY_PRIME_URL|DEPLOY_URL)\b|\[\s*['"](?:NETLIFY|CONTEXT|DEPLOY_ID|DEPLOY_PRIME_URL|DEPLOY_URL)['"]\s*\])/,
    'Netlify-specific environment wiring',
  ],
  [
    /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*)['"]@netlify\//,
    'Netlify-specific import',
  ],
];
const sourceConfigurationResiduePatterns = [
  [
    /(?:\bort\s*\.\s*)?\benv\s*\.\s*logLevel\s*=/i,
    'explicit ORT environment log level',
  ],
  [
    /\b(?:logSeverityLevel|logVerbosityLevel)\s*:/,
    'explicit ORT session logging option',
  ],
  [
    /\bexecutionProviders\s*:\s*\[[^\]]*['"]wasm['"]/s,
    'WASM execution-provider fallback',
  ],
];
assertNoSourceResidue(
  ben2ProductSources,
  [...sourceWiringResiduePatterns, ...sourceConfigurationResiduePatterns],
  'BEN2 product source residue',
);

for (const [description, source] of [
  ['ORT verbose environment logging', "ort.env.logLevel = 'verbose';"],
  [
    'ORT zero-severity session logging',
    'const options = { logSeverityLevel: 0 };',
  ],
  [
    'ORT nonzero verbosity session logging',
    'const options = { logVerbosityLevel: 4 };',
  ],
  [
    'WebGPU-to-WASM provider fallback',
    "const options = { executionProviders: ['webgpu', 'wasm'] };",
  ],
]) {
  assert.throws(
    () =>
      assertNoSourceResidue(
        new Map([['<self-check>', source]]),
        sourceConfigurationResiduePatterns,
        'configuration self-check',
      ),
    { name: 'AssertionError' },
    `source stripping assertions must reject ${description}`,
  );
}

const compressSource = ben2ProductSources.get(
  'src/client/lazy-app/Compress/index.tsx',
);
assert.match(
  compressSource,
  /function ben2IsEnabled\([^)]*processorState[^)]*\)[^{]*{\s*return processorState\.ben2\.enabled;\s*}/s,
  'effective BEN2 enablement must derive only from per-side processor state',
);
assert.doesNotMatch(
  compressSource,
  /preprocessorState\.ben2/,
  'main Rotate preprocessing must not own BEN2',
);
assert.match(
  compressSource,
  /from ['"]\.\/ben2-processing['"]/,
  'Compress must use the dedicated shared BEN2 coordinator',
);
const mainJobSource = ben2ProductSources.get(
  'src/client/lazy-app/Compress/main-job.ts',
);
assert.doesNotMatch(
  mainJobSource,
  /\bben2\b|pngDecode|Ben2TerminalError/,
  'main preprocessing must remain Rotate-only',
);
const coordinatorSource = ben2ProductSources.get(
  'src/client/lazy-app/Compress/ben2-processing.ts',
);
assert.match(coordinatorSource, /createBen2Coordinator/);
assert.match(coordinatorSource, /pngDecode/);
assert.match(coordinatorSource, /rotate/);
assert.match(coordinatorSource, /ben2/);
const optionsSource = ben2ProductSources.get(
  'src/client/lazy-app/Compress/Options/index.tsx',
);
assert.match(optionsSource, />\s*Remove background\s*</);
assert.doesNotMatch(optionsSource, /Remove background \(BEN2\)/);
assert.match(optionsSource, /name="ben2\.enable"/);
assert.match(optionsSource, /onChange={this\.onProcessorEnabledChange}/);
assert.match(optionsSource, /prettyBytes\(modelBytes\)/);
assert.match(
  optionsSource,
  /download \(\$\{ben2ModelSize\.value\}\$\{ben2ModelSize\.unit\}\)/,
);
assert.match(optionsSource, /<loading-spinner aria-hidden="true"/);
for (const forbidden of [
  /Checking WebGPU support/i,
  /service worker/i,
  /Runtime assets/i,
  /partially cached/i,
  /First use/i,
  /Select an output format/i,
  /Removing background/i,
  /Retry/i,
  /JPEG/i,
  /OxiPNG/i,
  /Browser PNG/i,
  /transparen/i,
]) {
  assert.doesNotMatch(
    optionsSource,
    forbidden,
    `forbidden UI copy: ${forbidden}`,
  );
}
const metaSource = ben2ProductSources.get(
  'src/features/processors/ben2/shared/meta.ts',
);
assert.match(metaSource, /modelBytes\s*=\s*219_121_675/);
const require = createRequire(import.meta.url);
const ts = require('typescript');
const prettyBytesModule = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(
    ben2ProductSources.get(
      'src/client/lazy-app/Compress/Results/pretty-bytes.ts',
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    },
  ).outputText,
  { exports: prettyBytesModule.exports, module: prettyBytesModule, Math },
);
assert.deepEqual(
  JSON.parse(JSON.stringify(prettyBytesModule.exports.default(219_121_675))),
  { value: '219', unit: 'MB' },
);
for (const outputPath of [
  'src/client/lazy-app/Compress/Output/index.tsx',
  'src/client/lazy-app/Compress/Output/style.css',
]) {
  const outputSource = await readFile(path.join(root, outputPath), 'utf8');
  assert.doesNotMatch(
    outputSource,
    /BEN2|ben2[A-Z]|\.ben2-/,
    `Output must not retain shared BEN2 UI (${outputPath})`,
  );
}
const workerSource = ben2ProductSources.get(
  'src/features/processors/ben2/worker/ben2.ts',
);
assert.doesNotMatch(
  workerSource,
  /console\.(?:log|debug|info)\s*\(/,
  'BEN2 runtime must not emit verbose logs',
);
assert.match(workerSource, /readCachedBen2ModelBytes\(\)/);
assert.doesNotMatch(workerSource, /InferenceSession\.create\(modelUrl/);
const swBridgeSource = ben2ProductSources.get(
  'src/client/lazy-app/sw-bridge/index.ts',
);
assert.doesNotMatch(
  swBridgeSource,
  /ben2-cache-status|ben2-download-model|MessageChannel/,
);
const ben2RuntimeSources = new Map(
  [...ben2ProductSources].filter(([sourcePath]) =>
    sourcePath.startsWith('src/'),
  ),
);
assertNoSourceResidue(
  ben2RuntimeSources,
  [
    [
      /https?:\/\/(?:huggingface\.co|hf\.co)\/|https?:\/\/[^'"`\s]+\.onnx(?:[?#/][^'"`\s]*)?/i,
      'remote model runtime URL',
    ],
    [
      /\b(?:modelUrl|MODEL_URL)\s*=\s*['"`]https?:\/\//,
      'remote model URL configuration',
    ],
    [
      /['"`](?:\/tmp\/squoosh|(?:\.\.\/)*evidence\/)/i,
      'acceptance evidence or machine-local path literal',
    ],
  ],
  'BEN2 runtime source residue',
);

const buildTextFiles = buildFiles.filter((file) =>
  new Set(['.js', '.mjs', '.html', '.json']).has(path.extname(file)),
);
const buildText = (
  await Promise.all(buildTextFiles.map((file) => readFile(file, 'utf8')))
).join('\n');
const buildResiduePatterns = [
  [/\b(?:BEN2_ACCEPTANCE|__BEN2_ACCEPTANCE__)\b/i, 'BEN2 acceptance state'],
  [/\b__squooshBen2[\w$]*\b/, 'BEN2 acceptance/audit global'],
  [/\bben2SpikeEnabled\b/i, 'BEN2 query-gated spike flag'],
  [
    /\b(?:squoosh-)?ben2-(?:acceptance|cancellation-audit|audit)(?:-[a-z0-9-]+)?\b/i,
    'BEN2 acceptance/audit module or channel identifier',
  ],
  [
    /\bben2(?:Acceptance|CancellationAudit|Audit)[\w$]*\b/,
    'BEN2 acceptance/audit identifier',
  ],
  [
    /\bnew\s+BroadcastChannel\s*\(\s*(['"`])[^'"`]*ben2[^'"`]*\1\s*\)/i,
    'BEN2 BroadcastChannel name',
  ],
  [legacyBen2QueryTransport, 'BEN2 query activation'],
  [
    /\.searchParams\.(?:has|get)\(\s*['"]ben2['"]\s*\)/i,
    'BEN2 URL.searchParams activation',
  ],
  [
    /\bnew\s+URLSearchParams\s*\([^)]*\)\.(?:has|get)\(\s*['"]ben2['"]\s*\)/i,
    'BEN2 URLSearchParams activation',
  ],
  [/\[BEN2[^\]]*\bspike\b[^\]]*\]/i, 'BEN2 spike diagnostic marker'],
  [
    /https?:\/\/(?:huggingface\.co|hf\.co)\/|https?:\/\/[^'"`\s]+\.onnx(?:[?#/][^'"`\s]*)?/i,
    'remote model runtime URL',
  ],
];
for (const [pattern, description] of buildResiduePatterns) {
  assert.doesNotMatch(buildText, pattern, `production residue: ${description}`);
}

console.log(
  'PASS BEN2 production asset, lazy-linkage, and stripping assertions',
);
