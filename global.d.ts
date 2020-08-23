declare interface NodeModule {
  hot: any;
}

declare interface Window {
  STATE: any;
  ga: typeof ga;
}

declare namespace JSX {
  interface Element { }
  interface IntrinsicElements { }
  interface HTMLAttributes {
    decoding?: string;
  }
}

declare module 'classnames' {
  export default function classnames(...args: any[]): string;
}
