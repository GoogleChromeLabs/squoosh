declare module '@webcomponents/custom-elements';

(async function () {
  if (!('customElements' in self)) {
    await import('@webcomponents/custom-elements');
  }

  require('./init-app.tsx');
})();
