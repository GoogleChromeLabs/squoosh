interface MultiPanelAttributes extends JSX.HTMLAttributes {
  'open-one-only'?: boolean;
}

declare namespace JSX {
  interface IntrinsicElements {
    'multi-panel': MultiPanelAttributes;
  }
}
