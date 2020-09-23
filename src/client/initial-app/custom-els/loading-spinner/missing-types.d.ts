interface LoadingSpinner extends preact.JSX.HTMLAttributes {}

declare module 'preact' {
  namespace createElement.JSX {
    interface IntrinsicElements {
      'loading-spinner': LoadingSpinner;
    }
  }
}

// Thing break unless this file is a module.
// Don't ask me why. I don't know.
export {};
