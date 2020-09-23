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

declare module 'file-loader!*' {
  const value: string;
  export default value;
}

declare module '*.worker.js' {
  const value: string;
  export default value;
}

declare module 'wasm-feature-detect' {
  export const threads: () => Promise<boolean>;
}

declare var VERSION: string;

declare var ga: {
  (...args: any[]): void;
  q: any[];
};

interface Navigator {
	readonly standalone: boolean;
}
