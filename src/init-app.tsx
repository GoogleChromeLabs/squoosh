import { h, render } from 'preact';
import './lib/fix-pmc.mjs';
import './style/index.scss';
import App from './components/App/index.tsx';

// Find the outermost Element in our server-rendered HTML structure.
let root = document.getElementById('app_root') as Element;

// "attach" the client-side rendering to it, updating the DOM in-place instead of replacing:
root = render(<App />, document.body, root);
root.setAttribute('id', 'app_root');

if (module.hot) {
  // Enable support for React DevTools and some helpful console warnings:
  import('preact/debug');
}
