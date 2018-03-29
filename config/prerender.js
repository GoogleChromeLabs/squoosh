let path = require('path');
let preact = require('preact');
let renderToString = require('preact-render-to-string');

let appPath = path.join(__dirname, '../src/index');

module.exports = function(options) {
  options = options || {};
  let url = typeof options==='string' ? options : options.url;
  global.history = {};
  global.location = { href: url, pathname: url };

  // let app = require('app-entry-point');
  let app = require(appPath);

  let html = renderToString(preact.h(app, { url }));
  console.log(html);

  return html;
};
