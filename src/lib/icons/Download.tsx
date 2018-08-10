import { h } from 'preact';
import { memoizedComponent } from '../memoized-component';

// @todo double check this will work with Uglify DCE
export default memoizedComponent(() => (
  // tslint:disable:max-line-length
  <svg width="24" height="24" viewBox="0 0 24 24">
    <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z" />
  </svg>
));
