import { h, render } from 'preact';
import './lib/fix-pmc.mjs';
import './style/index.scss';
import App from './components/App';

// Find the outermost Element in our server-rendered HTML structure.
let root = document.getElementById('app_root') as Element;

// "attach" the client-side rendering to it, updating the DOM in-place instead of replacing:
root = render(<App />, document.body, root);
root.setAttribute('id', 'app_root');

if (process.env.NODE_ENV !== 'production') {
  // Enable support for React DevTools and some helpful console warnings:
  require('preact/debug');

  // Full HMR may not be working due to https://github.com/parcel-bundler/parcel/issues/5016
  if (module.hot) {
    module.hot.accept();
  }
}
