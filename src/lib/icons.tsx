import { h } from 'preact';

// tslint:disable:max-line-length variable-name

const Icon = (props: JSX.HTMLAttributes) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props} />
);

export const DownloadIcon = (props: JSX.HTMLAttributes) => (
  <Icon {...props}>
    <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-7h-2zm-6 .7l2.6-2.6 1.4 1.4-5 5-5-5 1.4-1.4 2.6 2.6V3h2z"/>
  </Icon>
);

export const ToggleIcon = (props: JSX.HTMLAttributes) => (
  <Icon {...props}>
    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm2 4v-2H3c0 1.1.89 2 2 2zM3 9h2V7H3v2zm12 12h2v-2h-2v2zm4-18H9c-1.11 0-2 .9-2 2v10c0 1.1.89 2 2 2h10c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 12H9V5h10v10zm-8 6h2v-2h-2v2zm-4 0h2v-2H7v2z" />
  </Icon>
);

export const AddIcon = (props: JSX.HTMLAttributes) => (
  <Icon {...props}>
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
  </Icon>
);

export const RemoveIcon = (props: JSX.HTMLAttributes) => (
  <Icon {...props}>
    <path d="M19 13H5v-2h14v2z"/>
  </Icon>
);

export const UncheckedIcon = (props: JSX.HTMLAttributes) => (
  <Icon {...props}>
    <path d="M21.3 2.7v18.6H2.7V2.7h18.6m0-2.7H2.7A2.7 2.7 0 0 0 0 2.7v18.6A2.7 2.7 0 0 0 2.7 24h18.6a2.7 2.7 0 0 0 2.7-2.7V2.7A2.7 2.7 0 0 0 21.3 0z"/>
  </Icon>
);

export const CheckedIcon = (props: JSX.HTMLAttributes) => (
  <Icon {...props}>
    <path d="M21.3 0H2.7A2.7 2.7 0 0 0 0 2.7v18.6A2.7 2.7 0 0 0 2.7 24h18.6a2.7 2.7 0 0 0 2.7-2.7V2.7A2.7 2.7 0 0 0 21.3 0zm-12 18.7L2.7 12l1.8-1.9L9.3 15 19.5 4.8l1.8 1.9z"/>
  </Icon>
);

export const ExpandIcon = (props: JSX.HTMLAttributes) => (
  <Icon {...props}>
    <path d="M16.6 8.6L12 13.2 7.4 8.6 6 10l6 6 6-6z"/>
  </Icon>
);
