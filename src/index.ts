declare module '@webcomponents/custom-elements';

(async function () {
  if (!('customElements' in self)) {
    await import(
      /* webpackChunkName: "wc-polyfill" */
      '@webcomponents/custom-elements',
    );
  }

  require('./init-app.tsx');
})();
