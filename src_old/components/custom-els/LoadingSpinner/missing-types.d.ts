interface LoadingSpinner extends JSX.HTMLAttributes {}

declare namespace JSX {
  interface IntrinsicElements {
    'loading-spinner': LoadingSpinner;
  }
}
