const DtsCreator = require('typed-css-modules');
const chokidar = require('chokidar');
const util = require('util');
const sass = require('node-sass');

const sassRender = util.promisify(sass.render);

async function sassToCss(path) {
  const result = await sassRender({ file: path });
  return result.css;
}

/**
 * @typedef {Object} Opts
 * @property {boolean} watch Watch for changes
 */
/**
 * Create typing files for CSS & SCSS.
 *
 * @param {string[]} rootPaths Paths to search within
 * @param {Opts} [opts={}] Options.
 */
function addCssTypes(rootPaths, opts = {}) {
  return new Promise((resolve) => {
    const { watch = false } = opts;

    const paths = [];
    const preReadyPromises = [];
    let ready = false;

    for (const rootPath of rootPaths) {
      // Look for scss & css in each path.
      paths.push(rootPath + '/**/*.scss');
      paths.push(rootPath + '/**/*.css');
    }

    // For simplicity, the watcher is used even if we're not watching.
    // If we're not watching, we stop the watcher after the initial files are found.
    const watcher = chokidar.watch(paths, {
      // Avoid processing already-processed files.
      ignored: '*.d.*',
      // Without this, travis and netlify builds never complete. I'm not sure why, but it might be
      // related to https://github.com/paulmillr/chokidar/pull/758
      persistent: watch,
    });

    function change(path) {
      const promise = (async function() {
        const creator = new DtsCreator({ camelCase: true });
        const result = path.endsWith('.scss') ?
          await creator.create(path, await sassToCss(path)) :
          await creator.create(path);

        await result.writeFile();
      })();

      if (!ready) preReadyPromises.push(promise);
    }

    watcher.on('change', change);
    watcher.on('add', change);

    // 'ready' is when events have been fired for file discovery.
    watcher.on('ready', () => {
      ready = true;
      // Wait for the current set of processing to finish.
      Promise.all(preReadyPromises).then(resolve);
      // And if we're not watching, close the watcher.
      if (!watch) watcher.close();
    });
  })
}

module.exports = addCssTypes;
