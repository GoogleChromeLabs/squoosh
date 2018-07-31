import { SnackOptions } from '.';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'snack-bar': SnackBarAttributes;
    }

    interface SnackBarAttributes extends HTMLAttributes {
      showSnackbar?: (options: SnackOptions) => void;
    }
  }
}
