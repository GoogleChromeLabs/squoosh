const util = require('util');
const minimatch = require('minimatch');
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');
const WebWorkerTemplatePlugin = require('webpack/lib/webworker/WebWorkerTemplatePlugin');
const ParserHelpers = require('webpack/lib/ParserHelpers');

const NAME = 'auto-sw-plugin';
const JS_TYPES = ['auto', 'esm', 'dynamic'];

/**
 * Automatically finds and bundles Service Workers by looking for navigator.serviceWorker.register(..).
 * An Array of webpack assets is injected into the Service Worker bundle as a `BUILD_ASSETS` global.
 * Hidden and `.map` files are excluded by default, and this can be customized using the include & exclude options.
 * @example
 *  // webpack config
 *  plugins: [
 *    new AutoSWPlugin({
 *      exclude: [
 *        '**\/.*',     // don't expose hidden files (default)
 *        '**\/*.map',  // don't precache sourcemaps (default)
 *        'index.html'  // don't cache the page itself
 *      ]
 *    })
 *  ]
 * @param {Object} [options={}]
 * @param {string[]} [options.exclude]  Minimatch pattern(s) of which assets to omit from BUILD_ASSETS.
 * @param {string[]} [options.include]  Minimatch pattern(s) of assets to allow in BUILD_ASSETS.
 */
module.exports = class AutoSWPlugin {
  constructor(options) {
    this.options = Object.assign({
      exclude: [
        '**/*.map',
        '**/.*'
      ]
    }, options || {});
  }

  apply(compiler) {
    const serviceWorkers = [];

    compiler.hooks.emit.tapPromise(NAME, compilation => this.emit(compiler, compilation, serviceWorkers));

    compiler.hooks.normalModuleFactory.tap(NAME, (factory) => {
      for (const type of JS_TYPES) {
        factory.hooks.parser.for(`javascript/${type}`).tap(NAME, parser => {
          let counter = 0;

          const processRegisterCall = expr => {
            const dep = parser.evaluateExpression(expr.arguments[0]);

            if (!dep.isString()) {
              parser.state.module.warnings.push({
                message: 'navigator.serviceWorker.register() will only be bundled if passed a String literal.'
              });
              return false;
            }

            const filename = dep.string;
            const outputFilename = this.options.filename || 'serviceworker.js'
            const context = parser.state.current.context;
            serviceWorkers.push({
              outputFilename,
              filename,
              context
            });

            const id = `__webpack__serviceworker__${++counter}`;
            ParserHelpers.toConstantDependency(parser, id)(expr.arguments[0]);
            return ParserHelpers.addParsedVariableToModule(parser, id, '__webpack_public_path__ + ' + JSON.stringify(outputFilename));
          };

          parser.hooks.call.for('navigator.serviceWorker.register').tap(NAME, processRegisterCall);
          parser.hooks.call.for('self.navigator.serviceWorker.register').tap(NAME, processRegisterCall);
          parser.hooks.call.for('window.navigator.serviceWorker.register').tap(NAME, processRegisterCall);
        });
      }
    });
  }

  createFilter(list) {
    const filters = [].concat(list);
    for (let i=0; i<filters.length; i++) {
      if (typeof filters[i] === 'string') {
        filters[i] = minimatch.filter(filters[i]);
      }
    }
    return filters;
  }

  async emit(compiler, compilation, serviceWorkers) {
    let assetMapping = Object.keys(compilation.assets);
    if (this.options.include) {
      const filters = this.createFilter(this.options.include);
      assetMapping = assetMapping.filter(filename => {
        for (const filter of filters) {
          if (filter(filename)) return true;
        }
        return false;
      });
    }
    if (this.options.exclude) {
      const filters = this.createFilter(this.options.exclude);
      assetMapping = assetMapping.filter(filename => {
        for (const filter of filters) {
          if (filter(filename)) return false;
        }
        return true;
      });
    }
    await Promise.all(serviceWorkers.map(
      (serviceWorker, index) => this.compileServiceWorker(compiler, compilation, serviceWorker, index, assetMapping)
    ));
  }

  async compileServiceWorker(compiler, compilation, options, index, assetMapping) {
    const entryFilename = options.filename;

    const chunkFilename = compiler.options.output.chunkFilename.replace(/\.([a-z]+)$/i, '.serviceworker.$1');
    const workerOptions = {
      filename: options.outputFilename, // chunkFilename.replace(/\.?\[(?:chunkhash|contenthash|hash)(:\d+(?::\d+)?)?\]/g, ''),
      chunkFilename: this.options.chunkFilename || chunkFilename,
      globalObject: 'self'
    };

    const childCompiler = compilation.createChildCompiler(NAME, { filename: workerOptions.filename });
    (new WebWorkerTemplatePlugin(workerOptions)).apply(childCompiler);

    /* The duplication DefinePlugin ends up causing is problematic (it doesn't hoist injections), so we'll do it manually. */
    // (new DefinePlugin({
    //   BUILD_ASSETS: JSON.stringify(assetMapping)
    // })).apply(childCompiler);
    (new SingleEntryPlugin(options.context, entryFilename, workerOptions.filename)).apply(childCompiler);

    const subCache = `subcache ${__dirname} ${entryFilename} ${index}`;
    let childCompilation;
    childCompiler.hooks.compilation.tap(NAME, c => {
      childCompilation = c;
      if (childCompilation.cache) {
        if (!childCompilation.cache[subCache]) childCompilation.cache[subCache] = {};
        childCompilation.cache = childCompilation.cache[subCache];
      }
    });

    await (util.promisify(childCompiler.runAsChild.bind(childCompiler)))();

    const versionVar = this.options.version ?
      `var VERSION = ${JSON.stringify(this.options.version)};` : '';
    const original = childCompilation.assets[workerOptions.filename].source();
    const source = `${versionVar}var BUILD_ASSETS=${JSON.stringify(assetMapping)};${original}`;
    childCompilation.assets[workerOptions.filename] = {
      source: () => source,
      size: () => Buffer.byteLength(source, 'utf8')
    };

    Object.assign(compilation.assets, childCompilation.assets);
  }
};
