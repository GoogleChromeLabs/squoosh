const path = require('path');
const vm = require('vm');

module.exports = function (content) {
  const jsdom = require('jsdom');
  const preact = require('preact');
  const renderToString = require('preact-render-to-string');

  this.cacheable && this.cacheable();

  const callback = this.async();

  // const dom = new jsdom.JSDOM(`<!DOCTYPE html><html><head></head><body></body></html>`, {
  const dom = new jsdom.JSDOM(content, {
    includeNodeLocations: false,
    runScripts: 'outside-only'
  });
  const { window } = dom;
  const { document } = window;

  // console.log(content);

  const root = document.getElementById('app');
  this.loadModule(path.join(__dirname, 'client-boot.js'), (err, source) => {
    if (err) return callback(err);

    console.log(source);

    let mod = eval(source);
    let props = {};
    // console.log(mod);
    let vnode = preact.createElement(mod, props);
    let frag = document.createElement('div');
    frag.innerHTML = renderToString(vnode);
    root.parentNode.replaceChild(frag.firstChild, root);

    let html = dom.serialize();
    callback(null, html);
    // return html = `module.exports = ${JSON.stringify(html)}`;
    // return 'module.exports = ' + JSON.stringify(content).replace(/\{\{PRERENDER\}\}/gi, `" + require("preact-render-to-string")(require("app-entry-point")) + "`);
  });

  // global.window = global;
  // global.document = {};
  // return 'module.exports = ' + JSON.stringify(content).replace(/\{\{PRERENDER\}\}/gi, `" + require("preact-render-to-string")(require("app-entry-point")) + "`);

  /*
  let callback = this.async();

  let parts = content.split(/\{\{prerender\}\}/gi);

  if (parts.length<2) {
    // callback(null, `module.exports = ${JSON.stringify(content)}`);
    callback(null, content);
    return;
  }

  // let html = `
  //   window = {};
  // module.exports = ${JSON.stringify(parts[0])} + require("preact-render-to-string")(require("app-entry-point")) + ${JSON.stringify(parts[1])}`;
  let html = `module.exports = ${JSON.stringify(parts[0])} + require("preact-render-to-string")(require("app-entry-point")) + ${JSON.stringify(parts[1])}`;
  callback(null, html);
  */
};