import { SnackBarOptions } from '.';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'snack-bar': SnackBarAttributes;
    }

    interface SnackBarAttributes extends HTMLAttributes {
      showSnackbar?: (options: SnackBarOptions) => void;
    }
  }
}
