let loaderUtils = require('loader-utils');
let componentPath = require.resolve('./async-component');

module.exports = function () { };
module.exports.pitch = function (remainingRequest) {
  this.cacheable && this.cacheable();
  let query = loaderUtils.getOptions(this) || {};
  let routeName = typeof query.name === 'function' ? query.name(this.resourcePath) : null;
  let name;
  if (routeName !== null) {
    name = routeName;
  }
  else if ('name' in query) {
    name = query.name;
  }
  else if ('formatName' in query) {
    name = query.formatName(this.resourcePath);
  }

  return `
    import async from ${JSON.stringify(componentPath)};
    function load(cb) {
      require.ensure([], function (require) {
        cb( require(${loaderUtils.stringifyRequest(this, '!!' + remainingRequest)}) );
      }${name ? (', ' + JSON.stringify(name)) : ''});
    }
    export default async(load);
  `;
};