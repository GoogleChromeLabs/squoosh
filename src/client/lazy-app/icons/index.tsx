import { h } from 'preact';

const Icon = (props: preact.JSX.HTMLAttributes) => (
  // @ts-ignore - TS bug https://github.com/microsoft/TypeScript/issues/16019
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  />
);

export const ToggleAliasingIcon = (props: preact.JSX.HTMLAttributes) => (
  <Icon {...props}>
    <circle
      cx="12"
      cy="12"
      r="8"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    />
  </Icon>
);

export const ToggleAliasingActiveIcon = (props: preact.JSX.HTMLAttributes) => (
  <Icon {...props}>
    <path d="M12 3h5v2h2v2h2v5h-2V9h-2V7h-2V5h-3V3M21 12v5h-2v2h-2v2h-5v-2h3v-2h2v-2h2v-3h2M12 21H7v-2H5v-2H3v-5h2v3h2v2h2v2h3v2M3 12V7h2V5h2V3h5v2H9v2H7v2H5v3H3" />
  </Icon>
);

export const ToggleBackgroundIcon = (props: preact.JSX.HTMLAttributes) => (
  <Icon {...props}>
    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm2 4v-2H3c0 1.1.9 2 2 2zM3 9h2V7H3v2zm12 12h2v-2h-2v2zm4-18H9a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 12H9V5h10v10zm-8 6h2v-2h-2v2zm-4 0h2v-2H7v2z" />
  </Icon>
);

export const ToggleBackgroundActiveIcon = (
  props: preact.JSX.HTMLAttributes,
) => (
  <Icon {...props}>
    <path d="M9 7H7v2h2V7zm0 4H7v2h2v-2zm0-8a2 2 0 0 0-2 2h2V3zm4 12h-2v2h2v-2zm6-12v2h2a2 2 0 0 0-2-2zm-6 0h-2v2h2V3zM9 17v-2H7c0 1.1.9 2 2 2zm10-4h2v-2h-2v2zm0-4h2V7h-2v2zm0 8a2 2 0 0 0 2-2h-2v2zM5 7H3v12c0 1.1.9 2 2 2h12v-2H5V7zm10-2h2V3h-2v2zm0 12h2v-2h-2v2z" />
  </Icon>
);

export const RotateIcon = (props: preact.JSX.HTMLAttributes) => (
  <Icon {...props}>
    <path d="M15.6 5.5L11 1v3a8 8 0 0 0 0 16v-2a6 6 0 0 1 0-12v4l4.5-4.5zm4.3 5.5a8 8 0 0 0-1.6-3.9L17 8.5c.5.8.9 1.6 1 2.5h2zM13 17.9v2a8 8 0 0 0 3.9-1.6L15.5 17c-.8.5-1.6.9-2.5 1zm3.9-2.4l1.4 1.4A8 8 0 0 0 20 13h-2c-.1.9-.5 1.7-1 2.5z" />
  </Icon>
);

export const AddIcon = (props: preact.JSX.HTMLAttributes) => (
  <Icon {...props}>
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
  </Icon>
);

export const RemoveIcon = (props: preact.JSX.HTMLAttributes) => (
  <Icon {...props}>
    <path d="M19 13H5v-2h14v2z" />
  </Icon>
);

export const UncheckedIcon = (props: preact.JSX.HTMLAttributes) => (
  <Icon {...props}>
    <path d="M21.3 2.7v18.6H2.7V2.7h18.6m0-2.7H2.7A2.7 2.7 0 0 0 0 2.7v18.6A2.7 2.7 0 0 0 2.7 24h18.6a2.7 2.7 0 0 0 2.7-2.7V2.7A2.7 2.7 0 0 0 21.3 0z" />
  </Icon>
);

export const CheckedIcon = (props: preact.JSX.HTMLAttributes) => (
  <Icon {...props}>
    <path d="M21.3 0H2.7A2.7 2.7 0 0 0 0 2.7v18.6A2.7 2.7 0 0 0 2.7 24h18.6a2.7 2.7 0 0 0 2.7-2.7V2.7A2.7 2.7 0 0 0 21.3 0zm-12 18.7L2.7 12l1.8-1.9L9.3 15 19.5 4.8l1.8 1.9z" />
  </Icon>
);

export const ExpandIcon = (props: preact.JSX.HTMLAttributes) => (
  <Icon {...props}>
    <path d="M16.6 8.6L12 13.2 7.4 8.6 6 10l6 6 6-6z" />
  </Icon>
);

export const Arrow = () => (
  <svg viewBox="0 -1.95 9.8 9.8">
    <path d="M8.2.2a1 1 0 011.4 1.4l-4 4a1 1 0 01-1.4 0l-4-4A1 1 0 011.6.2l3.3 3.3L8.2.2z" />
  </svg>
);

export const DownloadIcon = () => (
  <svg viewBox="0 0 23.9 24.9">
    <path d="M6.6 2.7h-4v13.2h2.7A2.7 2.7 0 018 18.6a2.7 2.7 0 002.6 2.6h2.7a2.7 2.7 0 002.6-2.6 2.7 2.7 0 012.7-2.7h2.6V2.7h-4a1.3 1.3 0 110-2.7h4A2.7 2.7 0 0124 2.7v18.5a2.7 2.7 0 01-2.7 2.7H2.7A2.7 2.7 0 010 21.2V2.7A2.7 2.7 0 012.7 0h4a1.3 1.3 0 010 2.7zm4 7.4V1.3a1.3 1.3 0 112.7 0v8.8L15 8.4a1.3 1.3 0 011.9 1.8l-4 4a1.3 1.3 0 01-1.9 0l-4-4A1.3 1.3 0 019 8.4z" />
  </svg>
);

export const SwapIcon = () => (
  <svg viewBox="0 0 18 14">
    <path d="M5.5 3.6v6.8L2.1 7l3.4-3.4M7 0L0 7l7 7V0zm4 0v14l7-7-7-7z" />
  </svg>
);

export const SaveIcon = () => (
  <svg viewBox="0 0 24 24">
    <g
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    >
      <path d="M12.501 20.93c-.866.25-1.914-.166-2.176-1.247a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37c1 .608 2.296.07 2.572-1.065c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.074.26 1.49 1.296 1.252 2.158M19 22v-6m3 3l-3-3l-3 3" />
      <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0-6 0" />
    </g>
  </svg>
);

export const ImportIcon = () => (
  <svg viewBox="0 0 24 24">
    <g
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    >
      <path d="M12.52 20.924c-.87.262-1.93-.152-2.195-1.241a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37c1 .608 2.296.07 2.572-1.065c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.088.264 1.502 1.323 1.242 2.192M19 16v6m3-3l-3 3l-3-3" />
      <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0-6 0" />
    </g>
  </svg>
);
