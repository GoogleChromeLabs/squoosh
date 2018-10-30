import { h, render } from 'preact';
import './lib/fix-pmc';
import './style';
import App from './components/App';

// Find the outermost Element in our server-rendered HTML structure.
let root = document.querySelector('#app') || undefined;

// "attach" the client-side rendering to it, updating the DOM in-place instead of replacing:
root = render(<App />, document.body, root);

// In production, install a Service Worker
if (process.env.NODE_ENV === 'production') {
  navigator.serviceWorker.register('./sw');
} else {
  // Enable support for React DevTools and some helpful console warnings:
  require('preact/debug');

  // When an update to any module is received, re-import the app and trigger a full re-render:
  module.hot.accept('./components/App', () => {
    // The linter doesn't like the capital A in App. It is wrong.
    // tslint:disable-next-line variable-name
    import('./components/App').then(({ default: App }) => {
      root = render(<App />, document.body, root);
    });
  });
}
