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
  window.ga = window.ga || ((...args) => (ga.q = ga.q || []).push(args));
  ga('create', 'UA-128752250-1', 'auto');
  ga('set', 'transport', 'beacon');
  ga('send', 'pageview');
    // Load the GA script
  const s = document.createElement('script');
  s.src = 'https://www.google-analytics.com/analytics.js';
  document.head!.appendChild(s);
}
