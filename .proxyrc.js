module.exports = function(app) {
  // `app` is an Express instance
  app.use(function(req, res, next) {
    const sh = res.setHeader;
    res.setHeader = function(key, value) {
      // remove pointless/incorrect charset from binary responses:
      if (/^content-type$/i.test(key)) {
        const m = value && value.match(/^(image\/|application\/wasm); charset=.+$/);
        if (m) value = m[1];
      }
      return sh.call(this, key, value);
    }
    next();
  });
};
