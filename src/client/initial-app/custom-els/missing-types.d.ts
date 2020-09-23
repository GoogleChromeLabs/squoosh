import type { FileDropElement, FileDropEvent } from 'file-drop-element';

interface FileDropAttributes extends preact.JSX.HTMLAttributes {
  accept?: string;
  onfiledrop?: ((this: FileDropElement, ev: FileDropEvent) => any) | null;
}

declare module 'preact' {
  namespace createElement.JSX {
    interface IntrinsicElements {
      'file-drop': FileDropAttributes;
    }
  }
}

export {};
