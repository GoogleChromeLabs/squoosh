const fs = require('fs');

/** A Webpack plugin to refresh file mtime values from disk before compiling.
 *  This is used in order to account for SCSS-generated .d.ts files written
 *  as part of compilation so they trigger only a single recompile per write.
 *
 *  All credit for the technique and implementation goes to @reiv. See:
 *  https://github.com/Jimdo/typings-for-css-modules-loader/issues/48#issuecomment-347036461
 */
module.exports = class WatchTimestampsPlugin {
  constructor(patterns) {
    this.patterns = patterns;
  }

  apply(compiler) {
    compiler.hooks.watchRun.tapAsync('watch-timestamps-plugin', (watch, callback) => {
      const patterns = this.patterns;
      const timestamps = watch.fileTimestamps;

      for (const filepath of timestamps) {
        if (patterns.some(pat => pat instanceof RegExp ? pat.test(filepath) : filepath.indexOf(pat) === 0)) {
          let time = fs.statSync(filepath).mtime;
          if (timestamps instanceof Map) timestamps.set(filepath, time);
          else timestamps[filepath] = time;
        }
      }
      callback();
    });
  }
};
