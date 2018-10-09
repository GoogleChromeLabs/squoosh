declare namespace JSX {
  interface RangeInputAttributes extends HTMLAttributes {
    reversed?: boolean;
  }

  interface IntrinsicElements {
    'range-input': RangeInputAttributes;
  }
}
