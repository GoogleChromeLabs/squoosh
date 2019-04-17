import SnackBarElement from '.';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'snack-bar': SnackBarAttributes;
    }

    interface SnackBarAttributes extends HTMLAttributes {
      showSnackbar?: SnackBarElement['showSnackbar'];
    }
  }
}
