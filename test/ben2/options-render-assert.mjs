#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const preact = require('preact');
const render = require('preact-render-to-string');
const root = new URL('../../', import.meta.url);
const source = await readFile(
  new URL('src/client/lazy-app/Compress/Options/index.tsx', root),
  'utf8',
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    jsx: ts.JsxEmit.React,
    jsxFactory: 'h',
  },
}).outputText;
const prettyBytesModule = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(
    await readFile(
      new URL('src/client/lazy-app/Compress/Results/pretty-bytes.ts', root),
      'utf8',
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    },
  ).outputText,
  {
    exports: prettyBytesModule.exports,
    module: prettyBytesModule,
    Math,
  },
);

const passthrough = ({ children }) => preact.h('div', null, children);
const empty = () => null;
const module = { exports: {} };
vm.runInNewContext(compiled, {
  exports: module.exports,
  module,
  require(specifier) {
    if (specifier === 'preact') return preact;
    if (specifier === './style.css')
      return new Proxy({}, { get: (_, key) => String(key) });
    if (specifier === 'add-css:./style.css') return {};
    if (specifier === '../../util/clean-modify')
      return { cleanSet() {}, cleanMerge() {} };
    if (specifier === '../../feature-meta') return { encoderMap: {} };
    if (specifier === './Expander') return { default: passthrough };
    if (specifier === './Toggle') return { default: empty };
    if (specifier === './Select') return { default: passthrough };
    if (specifier === 'features/processors/ben2/shared/meta')
      return { modelBytes: 219_121_675 };
    if (specifier.startsWith('features/processors/')) return { Options: empty };
    if (specifier === 'client/lazy-app/icons')
      return { ImportIcon: empty, SaveIcon: empty, SwapIcon: empty };
    if (specifier === '../ben2-processing')
      return { ben2OptionsDecision: () => ({ resizeIsVector: false }) };
    if (specifier === '../Results/pretty-bytes')
      return prettyBytesModule.exports;
    if (specifier === 'shared/custom-els/loading-spinner') return {};
    throw new Error(`Unexpected Options import: ${specifier}`);
  },
  localStorage: { getItem: () => null },
  window: { addEventListener() {}, removeEventListener() {} },
  __PRERENDER__: true,
  Promise,
  Object,
  String,
});
const Options = module.exports.default;

const baseProps = {
  index: 0,
  mobileView: false,
  source: { vectorImage: {} },
  encoderState: undefined,
  processorState: {
    ben2: { enabled: true },
    resize: { enabled: false },
    quantize: { enabled: false },
  },
  ben2Capability: { state: 'supported' },
  ben2ModelCached: false,
  ben2Downloading: false,
  onEncoderTypeChange() {},
  onEncoderOptionsChange() {},
  onProcessorOptionsChange() {},
  onCopyToOtherSideClick() {},
  onSaveSideSettingsClick() {},
  onImportSideSettingsClick() {},
  onBen2Download() {},
};

const button = (html) =>
  html.match(/<button class="ben2Download"[\s\S]*?<\/button>/)?.[0];
const contents = (html) =>
  button(html)?.replace(/^<button[^>]*>|<\/button>$/g, '');

const idle = render(preact.h(Options, baseProps));
assert.equal(contents(idle), 'download (219MB)');
assert.match(button(idle), /aria-label="download \(219MB\)"/);
assert.match(button(idle), /aria-busy="false"/);
assert.doesNotMatch(button(idle), /disabled/);
assert.doesNotMatch(button(idle), /loading-spinner/);
assert.match(idle, /BEN2 Neural Network is not cached\./);

const downloading = render(
  preact.h(Options, { ...baseProps, ben2Downloading: true }),
);
assert.match(button(downloading), /aria-label="download \(219MB\)"/);
assert.match(button(downloading), /aria-busy="true"/);
assert.match(button(downloading), /disabled/);
assert.equal(
  contents(downloading),
  '<loading-spinner aria-hidden="true"></loading-spinner>',
);
assert.equal((button(downloading).match(/loading-spinner/g) || []).length, 2);
assert.doesNotMatch(contents(downloading), /download|Downloading|BEN2/i);

const cached = render(
  preact.h(Options, { ...baseProps, ben2ModelCached: true }),
);
assert.equal(button(cached), undefined);
assert.match(cached, /BEN2 Neural Network is cached\./);

console.log('PASS rendered BEN2 download idle/spinner/cached DOM');
