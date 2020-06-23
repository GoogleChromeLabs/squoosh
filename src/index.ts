declare module '@webcomponents/custom-elements';

function init() {
  require('./init-app.tsx');
}

if (!('customElements' in self)) {
  import(
    /* webpackChunkName: "wc-polyfill" */
    '@webcomponents/custom-elements').then(init);
} else {
  init();
}

if (typeof PRERENDER === 'undefined') {
  // Determine the current display mode.
  let displayMode = 'browser';
  const mqStandAlone = '(display-mode: standalone)';
  if (navigator.standalone || window.matchMedia(mqStandAlone).matches) {
    displayMode = 'standalone';
  }
  // Setup analytics
  window.ga = window.ga || ((...args) => (ga.q = ga.q || []).push(args));
  ga('create', 'UA-128752250-1', 'auto');
  ga('set', 'transport', 'beacon');
  ga('set', 'dimensionX', displayMode);
  ga('send', 'pageview');
  // Load the GA script
  const s = document.createElement('script');
  s.src = 'https://www.google-analytics.com/analytics.js';
  document.head!.appendChild(s);
}
