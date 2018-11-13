interface CanvasRenderingContext2D {
  filter: string;
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

declare module 'url-loader!*' {
  const value: string;
  export default value;
}

declare var VERSION: string;

declare var ga: {
  (...args: any[]): void;
  q: any[];
};
