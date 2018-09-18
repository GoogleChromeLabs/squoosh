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
  'orientation'?: string;
  'legacy-clip-compat'?: boolean;
}

declare namespace JSX {
  interface IntrinsicElements {
    'two-up': TwoUpAttributes;
  }
}

interface DOMRectReadOnly {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

interface ResizeObserverCallback {
  (entries: ResizeObserverEntry[], observer: ResizeObserver): void;
}

interface ResizeObserverEntry {
  readonly target: Element;
  readonly contentRect: DOMRectReadOnly;
}

interface ResizeObserver {
  observe(target: Element): void;
  unobserve(target: Element): void;
  disconnect(): void;
}

declare var ResizeObserver: {
  prototype: ResizeObserver;
  new(callback: ResizeObserverCallback): ResizeObserver;
};
