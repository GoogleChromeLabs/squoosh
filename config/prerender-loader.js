const jsdom = require('jsdom');
const os = require('os');
const util = require('util');
const path = require('path');
const loaderUtils = require('loader-utils');
const LibraryTemplatePlugin = require('webpack/lib/LibraryTemplatePlugin');
const NodeTemplatePlugin = require('webpack/lib/node/NodeTemplatePlugin');
const NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin');
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');
const DefinePlugin = require('webpack').DefinePlugin;
const MemoryFs = require('memory-fs');

const FILENAME = 'ssr-bundle.js';

const PRERENDER_REG = /\{\{prerender(?::\s*([^}]+)\s*)?\}\}/;

module.exports = function PrerenderLoader (content) {
  const options = loaderUtils.getOptions(this) || {};
  const outputFilter = options.as === 'string' || options.string ? stringToModule : String;

  if (options.disabled === true) {
    return outputFilter(content);
  }

  // When applied to HTML, attempts to inject into a specified {{prerender}} field.
  // @note: this is only used when the entry module exports a String or function
  // that resolves to a String, otherwise the whole document is serialized.
  let inject = false;
  if (!this.request.match(/.(js|ts)x?$/i)) {
    const matches = content.match(PRERENDER_REG);
    if (matches) {
      inject = true;
      options.entry = matches[1];
    }
    options.templateContent = content;
  }

  const callback = this.async();

  prerender(this, options, inject)
    .then(output => {
      callback(null, outputFilter(output));
    })
    .catch(err => {
      console.error(err);
      callback(err);
    });
};

async function prerender (loaderContext, options, inject) {
  const parentCompilation = loaderContext._compilation;
  const parentCompiler = rootCompiler(parentCompilation.compiler);
  const request = loaderContext.request;
  const context = parentCompiler.options.context || process.cwd();
  const entry = './' + ((options.entry && [].concat(options.entry).pop().trim()) || path.relative(context, parentCompiler.options.entry));

  if (!inject && options.template) {
    const loadModule = util.promisify(loaderContext.loadModule);
    const source = await loadModule('!!raw-loader!' + path.resolve(context, options.template));
    options.templateContent = source;
  }

  const outputOptions = {
    // fix for plugins not using outputfilesystem
    path: os.tmpdir(),
    filename: FILENAME
  };

  // Only copy over mini-extract-text-plugin (excluding it breaks extraction entirely)
  const plugins = (parentCompiler.options.plugins || []).filter(c => /MiniCssExtractPlugin/i.test(c.constructor.name));

  // Compile to an in-memory filesystem since we just want the resulting bundled code as a string
  const compiler = parentCompilation.createChildCompiler('prerender', outputOptions, plugins);
  compiler.outputFileSystem = new MemoryFs();

  // Define PRERENDER to be true within the SSR bundle
  new DefinePlugin({
    PRERENDER: 'true'
  }).apply(compiler);

  // ... then define PRERENDER to be false within the client bundle
  new DefinePlugin({
    PRERENDER: 'false'
  }).apply(parentCompiler);

  // Compile to CommonJS to be executed by Node
  new NodeTemplatePlugin(outputOptions).apply(compiler);
  new NodeTargetPlugin().apply(compiler);

  new LibraryTemplatePlugin('PRERENDER_RESULT', 'var').apply(compiler);

  // Kick off compilation at our entry module (either the parent compiler's entry or a custom one defined via `{{prerender:entry.js}}`)
  new SingleEntryPlugin(context, entry, undefined).apply(compiler);

  // Set up cache inheritance for the child compiler
  const subCache = 'subcache ' + request;
  function addChildCache (compilation, data) {
    if (compilation.cache) {
      if (!compilation.cache[subCache]) compilation.cache[subCache] = {};
      compilation.cache = compilation.cache[subCache];
    }
  }
  if (compiler.hooks) {
    compiler.hooks.compilation.tap('prerender-loader', addChildCache);
  } else {
    compiler.plugin('compilation', addChildCache);
  }

  const compilation = await runChildCompiler(compiler);
  let result = '';
  let dom, injectParent;

  if (compilation.assets[compilation.options.output.filename]) {
    // Get the compiled main bundle
    const output = compilation.assets[compilation.options.output.filename].source();

    const tpl = options.templateContent || '<!DOCTYPE html><html><head></head><body></body></html>';
    dom = new jsdom.JSDOM(tpl.replace(PRERENDER_REG, '<div id="PRERENDER_INJECT"></div>'), {
      includeNodeLocations: false,
      runScripts: 'outside-only'
    });
    const { window } = dom;

    // Find the placeholder node for injection & remove it
    const injectPlaceholder = window.document.getElementById('PRERENDER_INJECT');
    if (injectPlaceholder) {
      injectParent = injectPlaceholder.parentNode;
      injectPlaceholder.remove();
    }

    // These are missing from JSDOM
    window.requestAnimationFrame = setTimeout;
    window.cancelAnimationFrame = clearTimeout;

    // Invoke the SSR bundle within the JSDOM document and grab the exported/returned result
    result = window.eval(output + '\nPRERENDER_RESULT') || result;

    if (window.PRERENDER_RESULT != null) {
      result = window.PRERENDER_RESULT;
    }
  }

  // Deal with ES Module exports (just use the best guess):
  if (result && result.__esModule === true) {
    result = getBestModuleExport(result);
  }

  if (typeof result === 'function') {
    // @todo any arguments worth passing here?
    result = result();
  }

  // The entry can export or return a Promise in order to perform fully async prerendering:
  if (result && result.then) {
    result = await result;
  }

  // Returning or resolving to `null` / `undefined` defaults to serializing the whole document.
  // Note: this pypasses `inject` because the document is already derived from the template.
  if (result == null && dom) {
    result = dom.serialize();
  } else if (inject) {
    // @todo determine if this is really necessary for the string return case
    if (injectParent) {
      injectParent.insertAdjacentHTML('beforeend', result || '');
    } else {
      // Otherwise inject the prerendered HTML into the template
      result = options.templateContent.replace(PRERENDER_REG, result || '');
    }
  }

  return result;
}

// Promisified version of compiler.runAsChild() with error hoisting and isolated output/assets
function runChildCompiler (compiler) {
  return new Promise((resolve, reject) => {
    // runAsChild() merges assets into the parent compilation, we don't want that.
    compiler.compile((err, compilation) => {
      compiler.parentCompilation.children.push(compilation);
      if (err) return reject(err);

      if (compilation.errors && compilation.errors.length) {
        const errorDetails = compilation.errors.map(error => error.details).join('\n');
        return reject(Error('Child compilation failed:\n' + errorDetails));
      }

      resolve(compilation);
    });
  });
}

// Crawl up the compiler tree and return the outermost compiler instance
function rootCompiler (compiler) {
  while (compiler.parentCompilation && compiler.parentCompilation.compiler) {
    compiler = compiler.parentCompilation.compiler;
  }
  return compiler;
}

// Find the best possible export for an ES Module. Returns `undefined` for no exports.
function getBestModuleExport (exports) {
  if (exports.default) {
    return exports.default;
  }
  for (const prop in exports) {
    if (prop !== '__esModule') {
      return exports[prop];
    }
  }
}

// Wrap a String up into an ES Module that exports it
const stringToModule = str => 'export default ' + JSON.stringify(str);
