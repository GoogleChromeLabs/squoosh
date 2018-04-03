const fs = require('fs');
const path = require('path');
const parse5 = require('parse5');
const nwmatcher = require('nwmatcher');
const css = require('css');
const prettyBytes = require('pretty-bytes');

const treeUtils = parse5.treeAdapters.htmlparser2;

const PLUGIN_NAME = 'critters-webpack-plugin';

const PARSE5_OPTS = {
  treeAdapter: treeUtils
};

function defineProperties(obj, properties) {
  for (const i in properties) {
    const value = properties[i];
    Object.defineProperty(obj, i, typeof value === 'function' ? { value: value } : value);
  }
}

const ElementExtensions = {
  nodeName: {
    get: function() {
      return this.tagName;
    }
  },
  insertBefore: function (child, referenceNode) {
    if (!referenceNode) return this.appendChild(child);
    treeUtils.insertBefore(this, child, referenceNode);
    return child;
  },
  appendChild: function (child) {
    treeUtils.appendChild(this, child);
    return child;
  },
  removeChild: function (child) {
    treeUtils.detachNode(child);
  },
  setAttribute: function (name, value) {
    if (this.attribs == null) this.attribs = {};
    if (value == null) value = '';
    this.attribs[name] = value;
  },
  removeAttribute: function(name) {
    if (this.attribs != null) {
      delete this.attribs[name];
    }
  },
  getAttribute: function (name) {
    return this.attribs != null && this.attribs[name];
  },
  hasAttribute: function (name) {
    return this.attribs != null && this.attribs[name] != null;
  },
  getAttributeNode: function (name) {
    const value = this.getAttribute(name);
    if (value!=null) return { specified: true, value: value };
  },
  getElementsByTagName: getElementsByTagName
};

const DocumentExtensions = {
  nodeType: {
    get: function () {
      return 11;
    }
  },
  createElement: function (name) {
    return treeUtils.createElement(name, null, []);
  },
  createTextNode: function (text) {
    const scratch = this.$$scratchElement;
    treeUtils.insertText(scratch, text);
    const node = scratch.lastChild;
    treeUtils.detachNode(node);
    return node;
  },
  querySelector: function (sel) {
    return this.$match.first(sel);
  },
  querySelectorAll: function (sel) {
    return this.$match.select(sel);
  },
  getElementsByTagName: getElementsByTagName,
  // https://github.com/dperini/nwmatcher/blob/3edb471e12ce7f7d46dc1606c7f659ff45675a29/src/nwmatcher.js#L353
  addEventListener: Object
};

/** Critters: Webpack Plugin Edition!
 *  @class
 *  @param {Object} options
 *  @param {Boolean} [options.external=true]  Fetch and inline critical styles from external stylesheets
 *  @param {Boolean} [options.async=true]     If `false`, only already-inline stylesheets will be reduced to critical rules.
 */
module.exports = class CrittersWebpackPlugin {
  constructor(options) {
    this.options = options || {};
  }

  apply(compiler) {
    const self = this;
    const outputPath = compiler.options.output.path;
    compiler.hooks.compilation.tap(PLUGIN_NAME, function (compilation) {
      compilation.hooks.htmlWebpackPluginAfterHtmlProcessing.tapAsync(PLUGIN_NAME, function (htmlPluginData, callback) {
        const document = parse5.parse(htmlPluginData.html, PARSE5_OPTS);

        defineProperties(document, DocumentExtensions);
        document.documentElement = document.childNodes[document.childNodes.length - 1];

        const scratch = document.$$scratchElement = document.createElement('div');
        const elementProto = Object.getPrototypeOf(scratch);
        defineProperties(elementProto, ElementExtensions);
        elementProto.ownerDocument = document;

        document.$match = nwmatcher({ document });
        document.$match.configure({
          CACHING: false,
          USE_QSAPI: false,
          USE_HTML5: false
        });

        const externalSheets = document.querySelectorAll('link[rel="stylesheet"]');

        Promise.all(externalSheets.map(function(link) {
          if (self.options.external===false) return;
          const href = link.getAttribute('href');
          if (href.match(/^(https?:)?\/\//)) return Promise.resolve();
          const filename = path.resolve(outputPath, href.replace(/^\//, ''));
          const asset = compilation.assets[path.relative(outputPath, filename).replace(/^\.\//, '')];
          const promise = asset ? Promise.resolve(asset.source()) : readFile(filename);
          return promise.then(function (sheet) {
            const style = document.createElement('style');
            style.$$name = href;
            style.appendChild(document.createTextNode(sheet));
            link.parentNode.insertBefore(style, link.nextSibling);
            if (self.options.async) {
              link.setAttribute('rel', 'preload');
              link.setAttribute('as', 'style');
              link.setAttribute('onload', "this.rel='stylesheet'");
            }
          });
        }))
          .then(function() {
            const styles = document.$match.byTag('style');
            return Promise.all(styles.map(function (style) {
              return self.processStyle(style, document);
            }));
          })
          .then(function () {
            const html = parse5.serialize(document, PARSE5_OPTS);
            callback(null, { html });
          })
          .catch(function (err) {
            callback(err);
          });
      });
    });
  }

  processStyle(style, document) {
    let done = Promise.resolve();
    let sheet = style.childNodes.length>0 && style.childNodes.map(getNodeValue).join('\n');
    if (!sheet) return done;

    const ast = css.parse(sheet);

    const before = sheet;

    visit(ast, function (rule) {
      if (rule.type==='rule') {
        rule.selectors = rule.selectors.filter(function (sel) {
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

    if (this.options.minimize || this.options.compress || this.options.minify) {
      const cssnano = require('cssnano');
      done = cssnano.process(sheet, {}, { preset: 'default' }).then(function (result) {
        sheet = result.css;
      });
    }

    return done.then(function () {
      if (sheet.trim().length===0) {
        // all rules were removed, get rid of the style element entirely
        sheet.parentNode.removeChild(sheet);
      }
      else {
        // replace the stylesheet inline
        while (style.lastChild) {
          style.removeChild(style.lastChild);
        }
        style.appendChild(document.createTextNode(sheet));
      }
      const name = style.$$name ? style.$$name.replace(/^\//, '') : 'inline CSS';
      const percent = (before.length - sheet.length) / before.length * 100 | 0;
      console.log('\u001b[32mCritters: inlined ' + prettyBytes(sheet.length) + ' (' + percent + '% of original ' + prettyBytes(before.length) + ') of ' + name + '.\u001b[39m');
    });
  }
};


function visit(node, fn) {
  if (node.stylesheet) return visit(node.stylesheet, fn);

  node.rules.forEach(function (rule) {
    if (rule.rules) {
      visit(rule, fn);
    }
    fn(rule);
  });
}


function readFile(file) {
  return new Promise(function (resolve, reject) {
    fs.readFile(file, 'utf8', function (err, contents) {
      if (err) reject(err);
      else resolve(contents);
    });
  });
}

function getNodeValue(node) {
  return node.nodeValue;
}

function notComment(rule) {
  return rule.type !== 'comment';
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
