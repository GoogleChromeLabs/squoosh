declare module 'preact' {
  namespace createElement.JSX {
    interface IntrinsicElements {
      'range-input': HTMLAttributes & { formatter?: (v: number) => string };
    }
  }
}

export {};
