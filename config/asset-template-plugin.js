const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
const AssetsPlugin = require('assets-webpack-plugin');

module.exports = class AssetTemplatePlugin extends AssetsPlugin {
  constructor(options) {
    options = options || {};
    if (!options.template) throw Error('AssetTemplatePlugin: template option is required.');
    super({
      useCompilerPath: true,
      filename: options.filename,
      processOutput: files => this._processOutput(files)
    });
    this._template = path.resolve(process.cwd(), options.template);
    const ignore = options.ignore || /(manifest\.json|\.DS_Store)$/;
    this._ignore = typeof ignore === 'function' ? ({ test: ignore }) : ignore;
  }

  _processOutput(files) {
    const mapping = {
      all: [],
      byType: {},
      entries: {}
    };
    for (const entryName in files) {
      // non-entry-point-derived assets are collected under an empty string key
      // since that's a bit awkward, we'll call them "assets"
      const name = entryName === '' ? 'assets' : entryName;
      const listing = files[entryName];
      const entry = mapping.entries[name] = {
        all: [],
        byType: {}
      };
      for (let type in listing) {
        const list = [].concat(listing[type]).filter(file => !this._ignore.test(file));
        if (!list.length) continue;
        mapping.all = mapping.all.concat(list);
        mapping.byType[type] = (mapping.byType[type] || []).concat(list);
        entry.all = entry.all.concat(list);
        entry.byType[type] = (entry.byType[type] || []).concat(list);
      }
    }
    mapping.files = mapping.all;
    return ejs.render(fs.readFileSync(this._template, 'utf8'), mapping);
  }
};
