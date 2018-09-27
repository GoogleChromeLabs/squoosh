import { h, render } from 'preact';
import './lib/fix-pmc';
import './style';
import App from './components/App';

// Find the outermost Element in our server-rendered HTML structure.
let root = document.querySelector('#app') || undefined;

// "attach" the client-side rendering to it, updating the DOM in-place instead of replacing:
root = render(<App />, document.body, root);

// In production, this entire condition is removed.
if (process.env.NODE_ENV === 'development') {
  // Enable support for React DevTools and some helpful console warnings:
  require('preact/debug');

  // When an update to any module is received, re-import the app and trigger a full re-render:
  module.hot.accept('./components/App', () => {
    // tslint:disable-next-line variable-name
    import('./components/App').then(({ default: App }) => {
      root = render(<App />, document.body, root);
    });
  });
}
