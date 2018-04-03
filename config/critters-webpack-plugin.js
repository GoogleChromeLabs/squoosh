const fs = require('fs');
const path = require('path');
const parse5 = require('parse5');
const nwmatcher = require('nwmatcher');
const css = require('css');
const prettyBytes = require('pretty-bytes');

const treeAdapter = parse5.treeAdapters.htmlparser2;

const PLUGIN_NAME = 'critters-webpack-plugin';

const PARSE5_OPTS = {
  treeAdapter
};

/** Critters: Webpack Plugin Edition!
 *  @class
 *  @param {Object} options
 *  @param {Boolean} [options.external=true]  Fetch and inline critical styles from external stylesheets
 *  @param {Boolean} [options.async=false]    Convert critical-inlined external stylesheets to load asynchronously (via link rel="preload")
 *  @param {Boolean} [options.minify=false]   Minify resulting critical CSS using cssnano
 */
module.exports = class CrittersWebpackPlugin {
  constructor(options) {
    this.options = options || {};
  }

  apply(compiler) {
    const outputPath = compiler.options.output.path;

    // hook into the compiler to get a Compilation instance...
    compiler.hooks.compilation.tap(PLUGIN_NAME, compilation => {
      // ... which is how we get an "after" hook into html-webpack-plugin's HTML generation.
      compilation.hooks.htmlWebpackPluginAfterHtmlProcessing.tapAsync(PLUGIN_NAME, (htmlPluginData, callback) => {
        // Parse the generated HTML in a DOM we can mutate
        const document = parse5.parse(htmlPluginData.html, PARSE5_OPTS);
        makeDomInteractive(document);

        // `external:false` skips processing of external sheets
        const externalSheets = this.options.external===false ? [] : document.querySelectorAll('link[rel="stylesheet"]');

        Promise.all(externalSheets.map(link => {
          const href = link.getAttribute('href');

          // skip network resources
          if (href.match(/^(https?:)?\/\//)) return Promise.resolve();

          // path on disk
          const filename = path.resolve(outputPath, href.replace(/^\//, ''));

          // try to find a matching asset by filename in webpack's output (not yet written to disk)
          const asset = compilation.assets[path.relative(outputPath, filename).replace(/^\.\//, '')];

          // wait for a disk read if we had to go to disk
          const promise = asset ? Promise.resolve(asset.source()) : readFile(filename);
          return promise.then(sheet => {
            // the reduced critical CSS gets injected into a new <style> tag
            const style = document.createElement('style');
            style.appendChild(document.createTextNode(sheet));
            link.parentNode.insertBefore(style, link.nextSibling);

            // drop a reference to the original URL onto the tag (used for reporting to console later)
            style.$$name = href;

            // the `async` option changes any critical'd <link rel="stylesheet"> tags to async-loaded equivalents
            if (this.options.async) {
              link.setAttribute('rel', 'preload');
              link.setAttribute('as', 'style');
              link.setAttribute('onload', "this.rel='stylesheet'");
            }
          });
        }))
          .then(() => {
            // go through all the style tags in the document and reduce them to only critical CSS
            const styles = document.$match.byTag('style');
            return Promise.all(styles.map(style => this.processStyle(style, document)));
          })
          .then(() => {
            const html = parse5.serialize(document, PARSE5_OPTS);
            callback(null, { html });
          })
          .catch((err) => {
            callback(err);
          });
      });
    });
  }

  processStyle(style, document) {
    let done = Promise.resolve();

    // basically `.textContent`
    let sheet = style.childNodes.length>0 && style.childNodes.map( node => node.nodeValue ).join('\n');

    // store a reference to the previous serialized stylesheet for reporting stats
    const before = sheet;

    // Skip empty stylesheets
    if (!sheet) return done;

    const ast = css.parse(sheet);

    // Walk all CSS rules, transforming unused rules to comments (which get removed)
    visit(ast, (rule) => {
      if (rule.type==='rule') {
        rule.selectors = rule.selectors.filter((sel) => {
          // Remove unknown pseudos as they break nwmatcher
          sel = sel.replace(/::?(?:[a-z-]+)([.[#~&^:*]|\s|\n|$)/gi, '$1');
          return document.querySelector(sel, document) != null;
        });
        // If there are no matched selectors, replace the rule with a comment.
        if (rule.selectors.length===0) {
          rule.type = 'comment';
          rule.comment = '';
          delete rule.selectors;
          delete rule.declarations;
        }
      }

      if (rule.rules) {
        // Filter out comments
        rule.rules = rule.rules.filter(notComment);
        // If there are no remaining rules, replace the parent rule with a comment.
        if (rule.rules.length===0) {
          rule.type = 'comment';
          rule.comment = '';
          delete rule.rules;
        }
      }
    });

    sheet = css.stringify(ast, { compress: true });

    // Adding the `minify:true` option runs the resulting critical CSS through cssnano.
    if (this.options.minify) {
      const cssnano = require('cssnano');
      done = cssnano.process(sheet, {}, { preset: 'default' }).then((result) => {
        sheet = result.css;
      });
    }

    return done.then(() => {
      // If all rules were removed, get rid of the style element entirely
      if (sheet.trim().length===0) {
        sheet.parentNode.removeChild(sheet);
      }
      else {
        // replace the inline stylesheet with its critical'd counterpart
        while (style.lastChild) {
          style.removeChild(style.lastChild);
        }
        style.appendChild(document.createTextNode(sheet));
      }

      // output some stats
      const name = style.$$name ? style.$$name.replace(/^\//, '') : 'inline CSS';
      const percent = (before.length - sheet.length) / before.length * 100 | 0;
      console.log('\u001b[32mCritters: inlined ' + prettyBytes(sheet.length) + ' (' + percent + '% of original ' + prettyBytes(before.length) + ') of ' + name + '.\u001b[39m');
    });
  }
};


/** Predicate for non-comment CSS AST nodes */
function notComment(rule) {
  return rule.type !== 'comment';
}


/** Recursively walk all rules in a stylesheet. */
function visit(node, fn) {
  if (node.stylesheet) return visit(node.stylesheet, fn);

  node.rules.forEach((rule) => {
    if (rule.rules) {
      visit(rule, fn);
    }
    fn(rule);
  });
}


/** Promisified fs.readRile */
function readFile(file) {
  return new Promise(((resolve, reject) => {
    fs.readFile(file, 'utf8', (err, contents) => {
      if (err) reject(err);
      else resolve(contents);
    });
  }));
}

/** Enhance an htmlparser2-style DOM with basic manipulation methods. */
function makeDomInteractive(document) {
  defineProperties(document, DocumentExtensions);
  document.documentElement = document.childNodes[document.childNodes.length - 1];

  const scratch = document.$$scratchElement = document.createElement('div');
  const elementProto = Object.getPrototypeOf(scratch);
  defineProperties(elementProto, ElementExtensions);
  elementProto.ownerDocument = document;

  // nwmatcher is a selector engine that happens to work with Parse5's htmlparser2 DOM (they form the base of jsdom)
  document.$match = nwmatcher({ document });
  document.$match.configure({
    CACHING: false,
    USE_QSAPI: false,
    USE_HTML5: false
  });
}

function defineProperties(obj, properties) {
  for (const i in properties) {
    const value = properties[i];
    Object.defineProperty(obj, i, typeof value === 'function' ? { value } : value);
  }
}

function getElementsByTagName(tagName) {
  const stack = [this];
  const matches = [];
  const isWildCard = tagName === '*';
  const tagNameUpper = tagName.toUpperCase();
  while (stack.length !== 0) {
    const el = stack.pop();
    let child = el.lastChild;
    while (child) {
      if (child.nodeType === 1) stack.push(child);
      child = child.previousSibling;
    }
    if (isWildCard || (el.tagName != null && (el.tagName === tagNameUpper || el.tagName.toUpperCase() === tagNameUpper))) {
      matches.push(el);
    }
  }
  return matches;
}

const ElementExtensions = {
  nodeName: {
    get() {
      return this.tagName;
    }
  },
  insertBefore(child, referenceNode) {
    if (!referenceNode) return this.appendChild(child);
    treeAdapter.insertBefore(this, child, referenceNode);
    return child;
  },
  appendChild(child) {
    treeAdapter.appendChild(this, child);
    return child;
  },
  removeChild(child) {
    treeAdapter.detachNode(child);
  },
  setAttribute(name, value) {
    if (this.attribs == null) this.attribs = {};
    if (value == null) value = '';
    this.attribs[name] = value;
  },
  removeAttribute(name) {
    if (this.attribs != null) {
      delete this.attribs[name];
    }
  },
  getAttribute(name) {
    return this.attribs != null && this.attribs[name];
  },
  hasAttribute(name) {
    return this.attribs != null && this.attribs[name] != null;
  },
  getAttributeNode(name) {
    const value = this.getAttribute(name);
    if (value != null) return { specified: true, value };
  },
  getElementsByTagName
};

const DocumentExtensions = {
  nodeType: {
    get() {
      return 11;
    }
  },
  createElement(name) {
    return treeAdapter.createElement(name, null, []);
  },
  createTextNode(text) {
    const scratch = this.$$scratchElement;
    treeAdapter.insertText(scratch, text);
    const node = scratch.lastChild;
    treeAdapter.detachNode(node);
    return node;
  },
  querySelector(sel) {
    return this.$match.first(sel);
  },
  querySelectorAll(sel) {
    return this.$match.select(sel);
  },
  getElementsByTagName,
  // https://github.com/dperini/nwmatcher/blob/3edb471e12ce7f7d46dc1606c7f659ff45675a29/src/nwmatcher.js#L353
  addEventListener: Object
};