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
 *  @param {Boolean} [options.external=true]    Fetch and inline critical styles from external stylesheets
 *  @param {Boolean} [options.async=false]      Convert critical-inlined external stylesheets to load asynchronously (via link rel="preload" - see https://filamentgroup.com/lab/async-css.html)
 *  @param {Boolean} [options.preload=false]    (requires `async` option) Append a new <link rel="stylesheet"> into <body> instead of swapping the preload's rel attribute
 *  @param {Boolean} [options.fonts]            If `true`, keeps critical `@font-face` rules and preloads them. If `false`, removes the rules and does not preload the fonts
 *  @param {Boolean} [options.preloadFonts=false]   Preloads critical fonts (even those removed by `{fonts:false}`)
 *  @param {Boolean} [options.removeFonts=false]    Remove all fonts (even critical ones)
 *  @param {Boolean} [options.compress=true]        Compress resulting critical CSS
 */
module.exports = class CrittersWebpackPlugin {
  constructor (options) {
    this.options = options || {};
    this.urlFilter = this.options.filter;
    if (this.urlFilter instanceof RegExp) {
      this.urlFilter = this.urlFilter.test.bind(this.urlFilter);
    }
  }

  /** Invoked by Webpack during plugin initialization */
  apply (compiler) {
    // hook into the compiler to get a Compilation instance...
    compiler.hooks.compilation.tap(PLUGIN_NAME, compilation => {
      // ... which is how we get an "after" hook into html-webpack-plugin's HTML generation.
      compilation.hooks.htmlWebpackPluginAfterHtmlProcessing.tapAsync(PLUGIN_NAME, (htmlPluginData, callback) => {
        this.process(compiler, compilation, htmlPluginData)
          .then(result => { callback(null, result); })
          .catch(callback);
      });
    });
  }

  readFile (filename, encoding) {
    return new Promise((resolve, reject) => {
      this.fs.readFile(filename, encoding, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  async process (compiler, compilation, htmlPluginData) {
    const outputPath = compiler.options.output.path;

    // Parse the generated HTML in a DOM we can mutate
    const document = parse5.parse(htmlPluginData.html, PARSE5_OPTS);
    makeDomInteractive(document);

    // `external:false` skips processing of external sheets
    if (this.options.external !== false) {
      const externalSheets = document.querySelectorAll('link[rel="stylesheet"]');
      await Promise.all(externalSheets.map(
        link => this.embedLinkedStylesheet(link, compilation, outputPath)
      ));
    }

    // go through all the style tags in the document and reduce them to only critical CSS
    const styles = document.querySelectorAll('style');
    await Promise.all(styles.map(
      style => this.processStyle(style, document)
    ));

    // serialize the document back to HTML and we're done
    const html = parse5.serialize(document, PARSE5_OPTS);
    return { html };
  }

  /** Inline the target stylesheet referred to by a <link rel="stylesheet"> (assuming it passes `options.filter`) */
  async embedLinkedStylesheet (link, compilation, outputPath) {
    const href = link.getAttribute('href');
    const document = link.ownerDocument;

    // skip filtered resources, or network resources if no filter is provided
    if (this.urlFilter ? this.urlFilter(href) : href.match(/^(https?:)?\/\//)) return Promise.resolve();

    // path on disk
    const filename = path.resolve(outputPath, href.replace(/^\//, ''));

    // try to find a matching asset by filename in webpack's output (not yet written to disk)
    const asset = compilation.assets[path.relative(outputPath, filename).replace(/^\.\//, '')];

    // CSS loader is only injected for the first sheet, then this becomes an empty string
    let cssLoaderPreamble = `function $loadcss(u,l){(l=document.createElement('link')).rel='stylesheet';l.href=u;document.head.appendChild(l)}`;

    const media = typeof this.options.media === 'string' ? this.options.media : 'all';

    // { preload:'js', media:true }
    // { preload:'js', media:'print' }
    if (this.options.media) {
      cssLoaderPreamble = cssLoaderPreamble.replace('l.href', "l.media='only x';l.onload=function(){l.media='" + media + "'};l.href");
    }

    // Attempt to read from assets, falling back to a disk read
    const sheet = asset ? asset.source() : await this.readFile(filename, 'utf8');

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
      if (this.options.preload === 'js') {
        const script = document.createElement('script');
        script.appendChild(document.createTextNode(`${cssLoaderPreamble}$loadcss(${JSON.stringify(href)})`));
        link.parentNode.insertBefore(script, link.nextSibling);
        cssLoaderPreamble = '';
      } else if (this.options.preload) {
        const bodyLink = document.createElement('link');
        bodyLink.setAttribute('rel', 'stylesheet');
        bodyLink.setAttribute('href', href);
        document.body.appendChild(bodyLink);
      } else if (this.options.media) {
        // @see https://github.com/filamentgroup/loadCSS/blob/af1106cfe0bf70147e22185afa7ead96c01dec48/src/loadCSS.js#L26
        link.setAttribute('rel', 'stylesheet');
        link.removeAttribute('as');
        link.setAttribute('media', 'only x');
        link.setAttribute('onload', "this.media='" + media + "'");
      } else {
        link.setAttribute('onload', "this.rel='stylesheet'");
      }
    }
  }

  /** Parse the stylesheet within a <style> element, then reduce it to contain only rules used by the document. */
  async processStyle (style) {
    const options = this.options;
    const document = style.ownerDocument;
    const head = document.querySelector('head');

    // basically `.textContent`
    let sheet = style.childNodes.length > 0 && style.childNodes.map(node => node.nodeValue).join('\n');

    // store a reference to the previous serialized stylesheet for reporting stats
    const before = sheet;

    // Skip empty stylesheets
    if (!sheet) return;

    const ast = css.parse(sheet);

    // a string to search for font names (very loose)
    let criticalFonts = '';

    // Walk all CSS rules, transforming unused rules to comments (which get removed)
    visit(ast, rule => {
      if (rule.type === 'rule') {
        // Filter the selector list down to only those matche
        rule.selectors = rule.selectors.filter(sel => {
          // Strip pseudo-elements and pseudo-classes, since we only care that their associated elements exist.
          // This means any selector for a pseudo-element or having a pseudo-class will be inlined if the rest of the selector matches.
          sel = sel.replace(/::?(?:[a-z-]+)([.[#~&^:*]|\s|\n|$)/gi, '$1');
          return document.querySelector(sel, document) != null;
        });
        // If there are no matched selectors, remove the rule:
        if (rule.selectors.length === 0) {
          return false;
        }

        if (rule.declarations) {
          for (let i = 0; i < rule.declarations.length; i++) {
            const decl = rule.declarations[i];
            if (decl.property.match(/\bfont\b/i)) {
              criticalFonts += ' ' + decl.value;
            }
          }
        }
      }

      // keep font rules, they're handled in the second pass:
      if (rule.type === 'font-face') return;

      // If there are no remaining rules, remove the whole rule:
      return !rule.rules || rule.rules.length !== 0;
    });

    const preloadedFonts = [];
    visit(ast, rule => {
      // only process @font-face rules in the second pass
      if (rule.type !== 'font-face') return;

      let family, src;
      for (let i = 0; i < rule.declarations.length; i++) {
        const decl = rule.declarations[i];
        if (decl.property === 'src') {
          // @todo parse this properly and generate multiple preloads with type="font/woff2" etc
          src = (decl.value.match(/url\s*\(\s*(['"]?)(.+?)\1\s*\)/) || [])[2];
        } else if (decl.property === 'font-family') {
          family = decl.value;
        }
      }

      if (src && (options.fonts === true || options.preloadFonts) && preloadedFonts.indexOf(src) === -1) {
        preloadedFonts.push(src);
        const preload = document.createElement('link');
        preload.setAttribute('rel', 'preload');
        preload.setAttribute('as', 'font');
        if (src.match(/:\/\//)) {
          preload.setAttribute('crossorigin', 'anonymous');
        }
        preload.setAttribute('href', src.trim());
        head.appendChild(preload);
      }

      // if we're missing info or the font is unused, remove the rule:
      if (!family || !src || criticalFonts.indexOf(family) === -1 || !options.fonts || options.removeFonts) return false;
    });

    sheet = css.stringify(ast, { compress: this.options.compress !== false });

    // If all rules were removed, get rid of the style element entirely
    if (sheet.trim().length === 0) {
      sheet.parentNode.removeChild(sheet);
    } else {
      // replace the inline stylesheet with its critical'd counterpart
      while (style.lastChild) {
        style.removeChild(style.lastChild);
      }
      style.appendChild(document.createTextNode(sheet));
    }

    // output some stats
    const name = style.$$name ? style.$$name.replace(/^\//, '') : 'inline CSS';
    const percent = sheet.length / before.length * 100 | 0;
    console.log('\u001b[32mCritters: inlined ' + prettyBytes(sheet.length) + ' (' + percent + '% of original ' + prettyBytes(before.length) + ') of ' + name + '.\u001b[39m');
  }
};

/** Recursively walk all rules in a stylesheet.
 *  The iterator can explicitly return `false` to remove the current node.
 */
function visit (node, fn) {
  if (node.stylesheet) return visit(node.stylesheet, fn);

  node.rules = node.rules.filter(rule => {
    if (rule.rules) {
      visit(rule, fn);
    }
    return fn(rule) !== false;
  });
}

/** Enhance an htmlparser2-style DOM with basic manipulation methods. */
function makeDomInteractive (document) {
  defineProperties(document, DocumentExtensions);
  // Find the first <html> element within the document
  // document.documentElement = document.childNodes.filter( child => String(child.tagName).toLowerCase()==='html' )[0];

  // Extend Element.prototype with DOM manipulation methods.
  //   Note: document.$$scratchElement is also used by createTextNode()
  const scratch = document.$$scratchElement = document.createElement('div');
  const elementProto = Object.getPrototypeOf(scratch);
  defineProperties(elementProto, ElementExtensions);
  elementProto.ownerDocument = document;

  // nwmatcher is a selector engine that happens to work with Parse5's htmlparser2 DOM (they form the base of jsdom).
  // It is exposed to the document so that it can be used within Element.prototype methods.
  document.$match = nwmatcher({ document });
  document.$match.configure({
    CACHING: false,
    USE_QSAPI: false,
    USE_HTML5: false
  });
}

/** Essentially Object.defineProperties() except any functions are assigned as values rather than descriptors. */
function defineProperties (obj, properties) {
  for (const i in properties) {
    const value = properties[i];
    Object.defineProperty(obj, i, typeof value === 'function' ? { value } : value);
  }
}

/** {document,Element}.getElementsByTagName() is the only traversal method required by nwmatcher.
 *    Note: if perf issues arise, 2 faster but more verbose implementations are benchmarked here:
 *    https://esbench.com/bench/5ac3b647f2949800a0f619e1
 */
function getElementsByTagName (tagName) {
  // Only return Element/Document nodes
  if ((this.nodeType !== 1 && this.nodeType !== 9) || this.type === 'directive') return [];
  return Array.prototype.concat.apply(
    // Add current element if it matches tag
    (tagName === '*' || (this.tagName && (this.tagName === tagName || this.nodeName === tagName.toUpperCase()))) ? [this] : [],
    // Check children recursively
    this.children.map(child => getElementsByTagName.call(child, tagName))
  );
}

const reflectedProperty = attributeName => ({
  get () {
    return this.getAttribute(attributeName);
  },
  set (value) {
    this.setAttribute(attributeName, value);
  }
});

/** Methods and descriptors to mix into Element.prototype */
const ElementExtensions = {
  nodeName: {
    get () {
      return this.tagName.toUpperCase();
    }
  },
  id: reflectedProperty('id'),
  className: reflectedProperty('class'),
  insertBefore (child, referenceNode) {
    if (!referenceNode) return this.appendChild(child);
    treeAdapter.insertBefore(this, child, referenceNode);
    return child;
  },
  appendChild (child) {
    treeAdapter.appendChild(this, child);
    return child;
  },
  removeChild (child) {
    treeAdapter.detachNode(child);
  },
  setAttribute (name, value) {
    if (this.attribs == null) this.attribs = {};
    if (value == null) value = '';
    this.attribs[name] = value;
  },
  removeAttribute (name) {
    if (this.attribs != null) {
      delete this.attribs[name];
    }
  },
  getAttribute (name) {
    return this.attribs != null && this.attribs[name];
  },
  hasAttribute (name) {
    return this.attribs != null && this.attribs[name] != null;
  },
  getAttributeNode (name) {
    const value = this.getAttribute(name);
    if (value != null) return { specified: true, value };
  },
  getElementsByTagName
};

/** Methods and descriptors to mix into the global document instance */
const DocumentExtensions = {
  // document is just an Element in htmlparser2, giving it a nodeType of ELEMENT_NODE.
  // nwmatcher requires that it at least report a correct nodeType of DOCUMENT_NODE.
  nodeType: {
    get () {
      return 9;
    }
  },
  nodeName: {
    get () {
      return '#document';
    }
  },
  documentElement: {
    get () {
      // Find the first <html> element within the document
      return this.childNodes.filter(child => String(child.tagName).toLowerCase() === 'html')[0];
    }
  },
  body: {
    get () {
      return this.querySelector('body');
    }
  },
  createElement (name) {
    return treeAdapter.createElement(name, null, []);
  },
  createTextNode (text) {
    // there is no dedicated createTextNode equivalent in htmlparser2's DOM, so
    // we have to insert Text and then remove and return the resulting Text node.
    const scratch = this.$$scratchElement;
    treeAdapter.insertText(scratch, text);
    const node = scratch.lastChild;
    treeAdapter.detachNode(node);
    return node;
  },
  querySelector (sel) {
    return this.$match.first(sel, this.documentElement);
  },
  querySelectorAll (sel) {
    return this.$match.select(sel, this.documentElement);
  },
  getElementsByTagName,
  // nwmatcher uses inexistence of `document.addEventListener` to detect IE:
  // https://github.com/dperini/nwmatcher/blob/3edb471e12ce7f7d46dc1606c7f659ff45675a29/src/nwmatcher.js#L353
  addEventListener: Object
};
