let fs = require('fs');
let path = require('path');
let webpack = require('webpack');
// let ExtractTextPlugin = require('extract-text-webpack-plugin');
let CleanWebpackPlugin = require('clean-webpack-plugin');
let ProgressBarPlugin = require('progress-bar-webpack-plugin');
let MiniCssExtractPlugin = require('mini-css-extract-plugin');
let HtmlWebpackPlugin = require('html-webpack-plugin');
let PreloadWebpackPlugin = require('preload-webpack-plugin');
let ReplacePlugin = require('webpack-plugin-replace');
let CopyPlugin = require('copy-webpack-plugin');
let WatchTimestampsPlugin = require('./config/watch-timestamps-plugin');
let BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

let oldWrite = process.stderr.write;
process.stderr.write = chunk => {
	if (String(chunk).indexOf('DeprecationWarning:')!==-1) return;
	return oldWrite.call(process.stderr, chunk);
};

function parseJson(text, fallback) {
	try {
		return JSON.parse(text);
	}
	catch (e) { }
	return fallback || {};
}

function readFile(filename) {
	try {
		return fs.readFileSync(filename);
	}
	catch (e) {}
}

module.exports = function(_, env) {
	let isProd = env.mode === 'production';
	let nodeModules = path.join(__dirname, 'node_modules');
	let componentStyleDirs = [
		path.join(__dirname, 'src/components'),
		path.join(__dirname, 'src/routes')
	];

	let babelRc = parseJson(readFile('.babelrc'));
	babelRc.babelrc = false;

	let manifest = parseJson(readFile('./src/manifest.json'));

	return {
		mode: env.mode || 'development',
		entry: path.join(__dirname, 'config/client-boot.js'),
		// entry: './src/index',
		output: {
			filename: isProd ? '[name].[chunkhash:5].js' : '[name].js',
			chunkFilename: '[name].chunk.[chunkhash:5].js',
			path: path.join(__dirname, 'build'),
			publicPath: '/'
		},
		resolve: {
			extensions: ['.ts', '.tsx', '.js', '.jsx', '.scss', '.css'],
			alias: {
				'app-entry-point': path.join(__dirname, 'src/index'),
				style: path.join(__dirname, 'src/style'),
				preact$: path.join(__dirname, 'node_modules/preact/dist/preact.js')
			}
		},
		resolveLoader: {
			alias: {
				async: path.join(__dirname, 'config/async-component-loader')
			}
		},
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					enforce: 'pre',
					// loader: 'awesome-typescript-loader',
					loader: 'ts-loader',
					exclude: nodeModules
				},
				{
					test: /\.(tsx?|jsx?)$/,
					loader: 'babel-loader',
					options: babelRc
				},
				{
					test: /\.(scss|sass)$/,
					loader: 'sass-loader',
					enforce: 'pre',
					options: {
						sourceMap: true,
						includePaths: [nodeModules]
					}
				},
				{
					test: /\.(scss|sass|css)$/,
					include: componentStyleDirs,
					use: [
						isProd ? MiniCssExtractPlugin.loader : 'style-loader',
						{
							// loader: 'typings-for-css-modules-loader?modules&localIdentName=[local]__[hash:base64:5]&importLoaders=1'+(isProd ? '&sourceMap' : '')
							// loader: 'css-loader',
							loader: 'typings-for-css-modules-loader',
							options: {
								modules: true,
								localIdentName: '[local]__[hash:base64:5]',
								namedExport: true,
								camelCase: true,
								importLoaders: 1,
								sourceMap: isProd,
								sass: true
							}
						}
					]
					// loader: ExtractTextPlugin.extract({
					// 	fallback: 'style-loader',
					// 	use: [{
					// 		loader: 'css-loader',
					// 		options: {
					// 			modules: true,
					// 			localIdentName: '[local]__[hash:base64:5]',
					// 			importLoaders: 1,
					// 			sourceMap: isProd
					// 		}
					// 	}]
					// })
				},
				{
					test: /\.(scss|sass|css)$/,
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
					// loader: ExtractTextPlugin.extract({
					// 	fallback: 'style-loader',
					// 	use: [{
					// 		loader: 'css-loader',
					// 		options: {
					// 			importLoaders: 1,
					// 			sourceMap: isProd
					// 		}
					// 	}]
					// })
				}
			]
		},
		plugins: [
			new ProgressBarPlugin({
				format: '\u001b[90m\u001b[44mBuild\u001b[49m\u001b[39m [:bar] \u001b[32m\u001b[1m:percent\u001b[22m\u001b[39m (:elapseds) \u001b[2m:msg\u001b[22m',
				renderThrottle: 100,
				summary: false,
				clear: true
			}),

			isProd && new CleanWebpackPlugin(['build']),
			isProd && new webpack.optimize.SplitChunksPlugin({}),
			isProd && new MiniCssExtractPlugin({}),
			// new ExtractTextPlugin({
			// 	filename: isProd ? 'style.[contenthash:5].css' : 'style.css',
			// 	disable: !isProd,
			// 	allChunks: true
			// }),

			// fixes infinite loop in typings-for-css-modules-loader:
			new webpack.WatchIgnorePlugin([
				/(c|sc|sa)ss\.d\.ts$/
			]),
			new WatchTimestampsPlugin([
				/(c|sc|sa)ss\.d\.ts$/
			]),
			new HtmlWebpackPlugin({
				filename: path.join(__dirname, 'build/index.html'),
				template: '!!ejs-loader!src/index.html',
				minify: isProd && {
					collapseWhitespace: true,
					removeScriptTypeAttributes: true,
					removeRedundantAttributes: true,
					removeStyleLinkTypeAttributes: true,
					removeComments: true
				},
				manifest,

				/** @todo Finish implementing prerendering similar to that of Preact CLI. */
				prerender() {
					return '<div id="app_root"></div>';
					// require('babel-register')({ ignore: false });
					// return require('./config/prerender')();
				},
				inject: true,
				compile: true
			}),
			isProd && new PreloadWebpackPlugin(),
			new webpack.DefinePlugin({
				process: '{}'
			}),
			isProd && new ReplacePlugin({
				include: /babel-helper$/,
				patterns: [{
					regex: /throw\s+(new\s+)?(Type|Reference)?Error\s*\(/g,
					value: s => `return;${Array(s.length - 7).join(' ')}(`
				}]
			}),
			new CopyPlugin([
				{ from: 'src/manifest.json', to: 'manifest.json' },
				{ from: 'src/assets', to: 'assets' }
			]),

			isProd && new BundleAnalyzerPlugin({
				analyzerMode: 'static',
				defaultSizes: 'gzip',
				openAnalyzer: false
			})
		].filter(Boolean),

		node: {
			console: false,
			global: true,
			process: false,
			__filename: 'mock',
			__dirname: 'mock',
			Buffer: false,
			setImmediate: false
		},

		devServer: {
			contentBase: path.join(__dirname, 'src'),
			inline: true,
			hot: true,
			historyApiFallback: true,
			noInfo: true,
			// quiet: true,
			clientLogLevel: 'none',
			stats: 'minimal',
			overlay: false
		}
	};
};
