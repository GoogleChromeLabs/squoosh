const fs = require("fs");

process.env.CHROME_BIN = require('puppeteer').executablePath();

  // TypeScript puts lots of comments in the default `tsconfig.json`, so you
  // can’t use `require()` to read it. Hence this hack.
  return eval("(" + fs.readFileSync(path).toString("utf-8") + ")");
}

const typeScriptConfig = readJsonFile("./tsconfig.json");
const babel = readJsonFile("./.babelrc");

module.exports = function(config) {
  const options = {
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: "",

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ["mocha", "chai", "karma-typescript"],

    // list of files / patterns to load in the browser
    files: [
      {
        pattern: "test/**/*.ts",
        type: "module"
      },
      {
        pattern: "src/**/*.ts",
        included: false
      }
    ],

    // list of files / patterns to exclude
    exclude: [],
// preprocess matching files before serving them to the browser // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      "src/**/*.ts": ["karma-typescript", "babel"],
      "test/**/*.ts": ["karma-typescript", "babel"]
    },
    babelPreprocessor: {
      options: babel
    },
    karmaTypescriptConfig: {
      // Inline `tsconfig.json` so that the right TS libs are loaded
      ...typeScriptConfig,
      // Coverage is a thing that karma-typescript forces on you and only
      // creates problems. This is the simplest way of disabling it that I
      // could find.
      coverageOptions: {
        exclude: /.*/
      }
    },
    mime: {
      // Default mimetype for .ts files is video/mp2t but we need
      // text/javascript for modules to work.
      "text/javascript": ["ts"]
    },
    plugins: [
      // Load all modules whose name starts with "karma" (usually the default).
      "karma-*",
      // We don’t have file extensions on our imports as they are primarily
      // consumed by webpack.  With Karma, however, this turns into a real HTTP
      // request for a non-existent file. This inline plugin is a middleware
      // that appends `.ts` to the request URL.
      {
        "middleware:redirect_to_ts": [
          "value",
          (req, res, next) => {
            if (req.url.startsWith("/base/src")) {
              req.url += '.ts';
            }
            next();
          }
        ]
      }
    ],
    // Run our middleware before all other middlewares.
    beforeMiddleware: ["redirect_to_ts"],

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ["progress"],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ["ChromeHeadless"],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // These custom files allow us to use ES6 modules in our tests.
    // Remove these 2 lines (and files) once https://github.com/karma-runner/karma/pull/2834 lands.
    customContextFile: "test/context.html",
    customDebugFile: "test/debug.html"
  };

  config.set(options);
};
