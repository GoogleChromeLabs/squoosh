interface TwoUpAttributes extends preact.JSX.HTMLAttributes {
  orientation?: string;
  'legacy-clip-compat'?: boolean;
}

declare module 'preact' {
  namespace createElement.JSX {
    interface IntrinsicElements {
      'two-up': TwoUpAttributes;
    }
  }
}

export {};
