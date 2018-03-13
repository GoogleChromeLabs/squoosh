let path = require('path');
let webpack = require('webpack');
// let ExtractTextPlugin = require('extract-text-webpack-plugin');
let MiniCssExtractPlugin = require('mini-css-extract-plugin');
let HtmlWebpackPlugin = require('html-webpack-plugin');
let PreloadWebpackPlugin = require('preload-webpack-plugin');
let ReplacePlugin = require('webpack-plugin-replace');
let CopyPlugin = require('copy-webpack-plugin');
let WatchTimestampsPlugin = require('./config/watch-timestamps-plugin');

module.exports = function(_, env) {
	let isProd = env.mode === 'production';
	let nodeModules = path.join(__dirname, 'node_modules');
	let componentStyleDirs = [
		path.join(__dirname, 'src/components'),
		path.join(__dirname, 'src/routes')
	];

	let babelRc = JSON.parse(require('fs').readFileSync('.babelrc'));
	babelRc.babelrc = false;
	babelRc.presets[0][1].modules = isProd ? false : 'commonjs';

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
				style: path.join(__dirname, 'src/style')
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
				manifest: require('./src/manifest.json'),

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
			])
		].filter(Boolean),

		devServer: {
			contentBase: path.join(__dirname, 'src'),
			inline: true,
			hot: true,
			historyApiFallback: true,
			noInfo: true,
			progress: true,
			// quiet: true,
			clientLogLevel: 'none',
			stats: 'minimal',
			overlay: false
		}
	};
};
