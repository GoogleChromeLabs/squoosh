interface CanvasRenderingContext2D {
  filter: string;
}

declare module '*.module.scss' {
  const classNameMapping: Record<string, string> & {
    default: Record<string, string>
  };
  export = classNameMapping;
}

// Handling file-loader imports:
declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.wasm' {
  const content: string;
  export default content;
}

declare module 'url:*' {
  const value: string;
  export default value;
}

declare module 'data-url:*' {
  const value: string;
  export default value;
}

declare var VERSION: string;

declare var ga: {
  (...args: any[]): void;
  q: any[];
};

interface Navigator {
  readonly standalone: boolean;
}
