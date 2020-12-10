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

export const SwapIcon = (props: preact.JSX.HTMLAttributes) => (
  <Icon {...props}>
    <path d="M9.01 14H2v2h7.01v3L13 15l-3.99-4zm5.98-1v-3H22V8h-7.01V5L11 9z" />
  </Icon>
);

export const FlipVerticallyIcon = (props: preact.JSX.HTMLAttributes) => (
  <Icon {...props}>
    <path d="M21 9V7h-2v2zM9 5V3H7v2zM5 21h14a2 2 0 002-2v-4h-2v4H5v-4H3v4a2 2 0 002 2zM3 5h2V3a2 2 0 00-2 2zm20 8v-2H1v2zm-6-8V3h-2v2zM5 9V7H3v2zm8-4V3h-2v2zm8 0a2 2 0 00-2-2v2z" />
  </Icon>
);

export const FlipHorizontallyIcon = (props: preact.JSX.HTMLAttributes) => (
  <Icon {...props}>
    <path d="M15 21h2v-2h-2zm4-12h2V7h-2zM3 5v14a2 2 0 002 2h4v-2H5V5h4V3H5a2 2 0 00-2 2zm16-2v2h2a2 2 0 00-2-2zm-8 20h2V1h-2zm8-6h2v-2h-2zM15 5h2V3h-2zm4 8h2v-2h-2zm0 8a2 2 0 002-2h-2z" />
  </Icon>
);

export const RotateClockwiseIcon = (props: preact.JSX.HTMLAttributes) => (
  <Icon {...props}>
    <path d="M16.05 5.34l-5.2-5.2v3.5a9.12 9.12 0 000 18.1v-2.3a6.84 6.84 0 010-13.5v4.47zm5 6.22a9.03 9.03 0 00-1.85-4.44l-1.62 1.62a6.63 6.63 0 011.16 2.82zm-7.91 7.87v2.31a9.05 9.05 0 004.45-1.84l-1.64-1.64a6.6 6.6 0 01-2.81 1.18zm4.44-2.76l1.62 1.61a9.03 9.03 0 001.85-4.44h-2.3a6.73 6.73 0 01-1.17 2.83z" />
  </Icon>
);

export const RotateCounterClockwiseIcon = (
  props: preact.JSX.HTMLAttributes,
) => (
  <Icon {...props}>
    <path d="M7.95 5.34l5.19-5.2v3.5a9.12 9.12 0 010 18.1v-2.3a6.84 6.84 0 000-13.5v4.47zm-5 6.22A9.03 9.03 0 014.8 7.12l1.62 1.62a6.63 6.63 0 00-1.17 2.82zm7.9 7.87v2.31A9.05 9.05 0 016.4 19.9l1.65-1.64a6.6 6.6 0 002.8 1.17zm-4.43-2.76L4.8 18.28a9.03 9.03 0 01-1.85-4.44h2.3a6.73 6.73 0 001.17 2.83z" />
  </Icon>
);

export const CheckmarkIcon = (props: preact.JSX.HTMLAttributes) => (
  <Icon {...props}>
    <path d="M9.76 17.56l-4.55-4.55-1.52 1.52 6.07 6.08 13-13.02-1.51-1.52z" />
  </Icon>
);

export const CompareIcon = (props: preact.JSX.HTMLAttributes) => (
  <Icon {...props}>
    <path d="M9.77 1.94h-5.6a2.24 2.24 0 00-2.22 2.25v15.65a2.24 2.24 0 002.24 2.23h5.59v2.24h2.23V-.31H9.78zm0 16.77h-5.6l5.6-6.7zM19.83 1.94h-5.6v2.25h5.6v14.53l-5.6-6.7v10.05h5.6a2.24 2.24 0 002.23-2.23V4.18a2.24 2.24 0 00-2.23-2.24z" />
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

export const MoreIcon = (props: preact.JSX.HTMLAttributes) => (
  <Icon {...props}>
    <circle cx="12" cy="6" r="2" fill="#fff" />
    <circle cx="12" cy="12" r="2" fill="#fff" />
    <circle cx="12" cy="18" r="2" fill="#fff" />
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

export const CLIIcon = () => (
  <svg viewBox="0 0 81.3 68.8">
    <path
      fill="none"
      stroke-miterlimit="15.6"
      stroke-width="6.3"
      d="M3.1 3.1h75v62.5h-75zm18.8 43.8l12.5-12.5-12.5-12.5m18.7 25h18.8"
    />
  </svg>
);
