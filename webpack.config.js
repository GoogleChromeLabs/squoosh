const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const CleanPlugin = require('clean-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const HtmlPlugin = require('html-webpack-plugin');
const ScriptExtHtmlPlugin = require('script-ext-html-webpack-plugin');
const ReplacePlugin = require('webpack-plugin-replace');
const CopyPlugin = require('copy-webpack-plugin');
const WatchTimestampsPlugin = require('./config/watch-timestamps-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const WorkerPlugin = require('worker-plugin');

function readJson (filename) {
  return JSON.parse(fs.readFileSync(filename));
}

module.exports = function (_, env) {
  const isProd = env.mode === 'production';
  const nodeModules = path.join(__dirname, 'node_modules');
  const componentStyleDirs = [
    path.join(__dirname, 'src/components'),
    path.join(__dirname, 'src/codecs'),
    path.join(__dirname, 'src/custom-els'),
    path.join(__dirname, 'src/lib'),
  ];

  return {
    mode: isProd ? 'production' : 'development',
    entry: './src/index',
    devtool: isProd ? 'source-map' : 'inline-source-map',
    stats: 'minimal',
    output: {
      filename: isProd ? '[name].[chunkhash:5].js' : '[name].js',
      chunkFilename: '[name].chunk.[chunkhash:5].js',
      path: path.join(__dirname, 'build'),
      publicPath: '/',
      globalObject: 'self'
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.mjs', '.js', '.scss', '.css'],
      alias: {
        style: path.join(__dirname, 'src/style')
      }
    },
    resolveLoader: {
      alias: {
        // async-component-loader returns a wrapper component that waits for the import to load before rendering:
        async: path.join(__dirname, 'config/async-component-loader')
      }
    },
    module: {
      // Disable the default JavaScript handling:
      defaultRules: [],
      rules: [
        {
          oneOf: [
            {
              test: /(\.mjs|\.esm\.js)$/i,
              type: 'javascript/esm',
              resolve: {},
              parser: {
                harmony: true,
                amd: false,
                commonjs: false,
                system: false,
                requireInclude: false,
                requireEnsure: false,
                requireContext: false,
                browserify: false,
                requireJs: false,
                node: false
              }
            },
            {
              type: 'javascript/auto',
              resolve: {},
              parser: {
                system: false,
                requireJs: false
              }
            }
          ]
        },
        {
          test: /\.(scss|sass)$/,
          loader: 'sass-loader',
          // SCSS gets preprocessed, then treated like any other CSS:
          enforce: 'pre',
          options: {
            sourceMap: true,
            includePaths: [nodeModules]
          }
        },
        {
          test: /\.(scss|sass|css)$/,
          // Only enable CSS Modules within `src/components/*`
          include: componentStyleDirs,
          use: [
            // In production, CSS is extracted to files on disk. In development, it's inlined into JS:
            isProd ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              // This is a fork of css-loader that auto-generates .d.ts files for CSS module imports.
              // The result is a definition file with the exported String classname mappings.
              loader: 'typings-for-css-modules-loader',
              options: {
                modules: true,
                localIdentName: isProd ? '[hash:base64:5]' : '[local]__[hash:base64:5]',
                namedExport: true,
                camelCase: true,
                importLoaders: 1,
                sourceMap: isProd,
                sass: true
              }
            }
          ]
        },
        {
          test: /\.(scss|sass|css)$/,
          // Process non-modular CSS everywhere *except* `src/components/*`
          exclude: componentStyleDirs,
          use: [
            isProd ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                sourceMap: isProd
              }
            }
          ]
        },
        {
          test: /\.tsx?$/,
          exclude: nodeModules,
          loader: 'ts-loader'
        },
        {
          test: /\.jsx?$/,
          loader: 'babel-loader',
          // Don't respect any Babel RC files found on the filesystem:
          options: Object.assign(readJson('.babelrc'), { babelrc: false })
        },
        {
          // All the codec files define a global with the same name as their file name. `exports-loader` attaches those to `module.exports`.
          test: /\/codecs\/.*\.js$/,
          loader: 'exports-loader'
        },
        {
          test: /\/codecs\/.*\.wasm$/,
          // This is needed to make webpack NOT process wasm files.
          // See https://github.com/webpack/webpack/issues/6725
          type: 'javascript/auto',
          loader: 'file-loader'
        },
        {
          test: /\.(png|svg|jpg|gif)$/,
          loader: 'file-loader'
        }
      ]
    },
    plugins: [
      new webpack.IgnorePlugin(/(fs|crypto|path)/, /\/codecs\//),
      // Pretty progressbar showing build progress:
      new ProgressBarPlugin({
        format: '\u001b[90m\u001b[44mBuild\u001b[49m\u001b[39m [:bar] \u001b[32m\u001b[1m:percent\u001b[22m\u001b[39m (:elapseds) \u001b[2m:msg\u001b[22m\r',
        renderThrottle: 100,
        summary: false,
        clear: true
      }),

      // Remove old files before outputting a production build:
      isProd && new CleanPlugin([
        'assets',
        '**/*.{css,js,json,html,map}'
      ], {
        root: path.join(__dirname, 'build'),
        verbose: false,
        beforeEmit: true
      }),

      new WorkerPlugin(),

      // Automatically split code into async chunks.
      // See: https://medium.com/webpack/webpack-4-code-splitting-chunk-graph-and-the-splitchunks-optimization-be739a861366
      isProd && new webpack.optimize.SplitChunksPlugin({}),

      // In production, extract all CSS to produce files on disk, even for
      // lazy-loaded CSS chunks. CSS for async chunks is loaded on-demand.
      // This is a modern Webpack 4 replacement for ExtractTextPlugin.
      // See: https://github.com/webpack-contrib/mini-css-extract-plugin
      // See also: https://twitter.com/wsokra/status/970253245733113856
      isProd && new MiniCssExtractPlugin({
        filename: '[name].[contenthash:5].css',
        chunkFilename: '[name].chunk.[contenthash:5].css'
      }),

      new OptimizeCssAssetsPlugin({
        cssProcessorOptions: {
          postcssReduceIdents: {
            counterStyle: false,
            gridTemplate: false,
            keyframes: false
          }
        }
      }),

      // These plugins fix infinite loop in typings-for-css-modules-loader.
      // See: https://github.com/Jimdo/typings-for-css-modules-loader/issues/35
      new webpack.WatchIgnorePlugin([
        /(c|sc|sa)ss\.d\.ts$/
      ]),
      new WatchTimestampsPlugin([
        /(c|sc|sa)ss\.d\.ts$/
      ]),

      // For now we're not doing SSR.
      new HtmlPlugin({
        filename: path.join(__dirname, 'build/index.html'),
        template: 'src/index.html',
        minify: isProd && {
          collapseWhitespace: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          removeRedundantAttributes: true,
          removeComments: true
        },
        manifest: readJson('./src/manifest.json'),
        inject: true,
        compile: true
      }),

      new ScriptExtHtmlPlugin({
        defaultAttribute: 'async'
      }),

      // Inline constants during build, so they can be folded by UglifyJS.
      new webpack.DefinePlugin({
        // We set node.process=false later in this config.
        // Here we make sure if (process && process.foo) still works:
        process: '{}'
      }),

      // Babel embeds helpful error messages into transpiled classes that we don't need in production.
      // Here we replace the constructor and message with a static throw, leaving the message to be DCE'd.
      // This is useful since it shows the message in SourceMapped code when debugging.
      isProd && new ReplacePlugin({
        include: /babel-helper$/,
        patterns: [{
          regex: /throw\s+(?:new\s+)?((?:Type|Reference)?Error)\s*\(/g,
          value: (s, type) => `throw 'babel error'; (`
        }]
      }),

      // Copying files via Webpack allows them to be served dynamically by `webpack serve`
      new CopyPlugin([
        { from: 'src/manifest.json', to: 'manifest.json' },
        { from: 'src/assets', to: 'assets' }
      ]),

      // For production builds, output module size analysis to build/report.html
      isProd && new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        defaultSizes: 'gzip',
        openAnalyzer: false
      })
    ].filter(Boolean), // Filter out any falsey plugin array entries.

    optimization: {
      minimizer: [
        new UglifyJsPlugin({
          sourceMap: isProd,
          extractComments: {
            file: 'build/licenses.txt'
          },
          uglifyOptions: {
            compress: {
              inline: 1
            },
            mangle: {
              safari10: true
            },
            output: {
              safari10: true
            }
          }
        })
      ]
    },

    // Turn off various NodeJS environment polyfills Webpack adds to bundles.
    // They're supposed to be added only when used, but the heuristic is loose
    // (eg: existence of a variable called setImmedaite in any scope)
    node: {
      console: false,
      // Keep global, it's just an alias of window and used by many third party modules:
      global: true,
      // Turn off process to avoid bundling a nextTick implementation:
      process: false,
      // Inline __filename and __dirname values:
      __filename: 'mock',
      __dirname: 'mock',
      // Never embed a portable implementation of Node's Buffer module:
      Buffer: false,
      // Never embed a setImmediate implementation:
      setImmediate: false
    },

    devServer: {
      // Any unmatched request paths will serve static files from src/*:
      contentBase: path.join(__dirname, 'src'),
      compress: true,
      // Request paths not ending in a file extension serve index.html:
      historyApiFallback: true,
      // Suppress forwarding of Webpack logs to the browser console:
      clientLogLevel: 'none',
      // Supress the extensive stats normally printed after a dev build (since sizes are mostly useless):
      stats: 'minimal',
      // Don't embed an error overlay ("redbox") into the client bundle:
      overlay: false
    }
  };
};
