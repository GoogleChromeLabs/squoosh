let fs = require('fs');

module.exports = WatchTimestampsPlugin;

function WatchTimestampsPlugin(patterns) {
	this.patterns = patterns;
}

WatchTimestampsPlugin.prototype.apply = function (compiler) {
	compiler.plugin('watch-run', (watch, callback) => {
		let patterns = this.patterns;
		let timestamps = watch.fileTimestamps || watch.compiler.fileTimestamps;

		Object.keys(timestamps).forEach( filepath => {
			if (patterns.some( pat => pat instanceof RegExp ? pat.test(filepath) : filepath.indexOf(pat)===0 )) {
				let time = fs.statSync(filepath).mtime;
				if (timestamps instanceof Map) timestamps.set(filepath, time);
				else timestamps[filepath] = time;
			}
		});
		callback();
	});
};