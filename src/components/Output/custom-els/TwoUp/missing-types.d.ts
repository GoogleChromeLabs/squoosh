declare interface CSSStyleDeclaration {
  willChange: string | null;
}

// TypeScript, you make me sad.
// https://github.com/Microsoft/TypeScript/issues/18756
interface Window {
  PointerEvent: typeof PointerEvent;
  Touch: typeof Touch;
}

interface TwoUpAttributes extends JSX.HTMLAttributes {
  'vertical'?: boolean;
  'legacy-clip-compat'?: boolean;
}

declare namespace JSX {
  interface IntrinsicElements {
    'two-up': TwoUpAttributes;
  }
}
