import { h } from 'preact';

// tslint:disable:max-line-length variable-name

export interface IconProps extends JSX.HTMLAttributes {}

const Icon = (props: IconProps) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props} />
);

export const DownloadIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z" />
  </Icon>
);

export const ToggleIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm2 4v-2H3c0 1.1.89 2 2 2zM3 9h2V7H3v2zm12 12h2v-2h-2v2zm4-18H9c-1.11 0-2 .9-2 2v10c0 1.1.89 2 2 2h10c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 12H9V5h10v10zm-8 6h2v-2h-2v2zm-4 0h2v-2H7v2z" />
  </Icon>
);

export const AddIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
  </Icon>
);

export const RemoveIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M19 13H5v-2h14v2z"/>
  </Icon>
);
