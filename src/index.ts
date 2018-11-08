declare module '@webcomponents/custom-elements';

function init() {
  require('./init-app.tsx');
}

if (!('customElements' in self)) {
  import(
    /* webpackChunkName: "wc-polyfill" */
    '@webcomponents/custom-elements',
  ).then(init);
} else {
  init();
}
