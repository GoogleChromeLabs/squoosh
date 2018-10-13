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

interface WorkerOptions {
  type?: 'classic' | 'module';
}

interface Window {
  Worker: {
    prototype: Worker;
    new(stringUrl: string, options?: WorkerOptions): Worker;
  };
}
