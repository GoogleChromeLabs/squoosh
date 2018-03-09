let path = require('path');
let webpack = require('webpack');
let MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = function(_, env) {
	return {
		mode: env.mode || 'development',
		entry: './src/index',
		resolve: {
			extensions: ['.ts', '.js', '.scss', '.css'],
			alias: {
				style: path.join(__dirname, 'src/style')
			}
		},
		module: {
			rules: [
				{
					test: /\.s?css$/,
					use: [
						MiniCssExtractPlugin.loader,
						{ loader: 'css-loader' },
						// 'sass-loader?includePaths='+encodeURIComponent(path.join(__dirname, 'node_modules'))
						{
							loader: 'sass-loader',
							options: {
								includePaths: [path.join(__dirname, 'node_modules')]
							}
						}
					]
				},
				{
					test: /\.ts$/,
					// loader: 'awesome-typescript-loader'
					loader: 'typescript-loader'
				},
				{
					test: /\.js$/,
					loader: 'babel-loader',
					options: {
						presets: [
							['env', {
								loose: true,
								uglify: true,
								modules: false,
								targets: {
									browsers: 'last 2 versions'
								},
								exclude: [
									'transform-regenerator',
									'transform-es2015-typeof-symbol'
								]
							}]
						],
						plugins: [
							'syntax-dynamic-import',
							'transform-decorators-legacy',
							'transform-class-properties',
							'transform-object-rest-spread',
							'transform-react-constant-elements',
							'transform-react-remove-prop-types',
							['transform-react-jsx', {
								pragma: 'h'
							}],
							['jsx-pragmatic', {
								module: 'preact',
								export: 'h',
								import: 'h'
							}]
						]
					}
				}
			]
		},
		plugins: [
			new webpack.optimize.SplitChunksPlugin({})
		]
	};
};
