declare namespace JSX {
  interface IntrinsicElements {
    'file-drop': FileDropAttributes;
  }

  interface FileDropAttributes extends HTMLAttributes {
    accepts?: string;
    onFileDrop?: ((this: HTMLElement, ev: CustomEvent) => any) | null;
  }
}