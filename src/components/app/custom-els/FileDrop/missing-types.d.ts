import { FileDropEvent, FileDrop } from '.';

declare global {

  interface HTMLElementEventMap {
    'filedrop': FileDropEvent;
  }

  namespace JSX {
    interface IntrinsicElements {
      'file-drop': FileDropAttributes;
    }

    interface FileDropAttributes extends HTMLAttributes {
      accept?: string;
      onfiledrop?: ((this: FileDrop, ev: FileDropEvent) => any) | null;
    }
  }
}
