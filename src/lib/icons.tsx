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

export const ToggleBackgroundIcon = (props: JSX.HTMLAttributes) => (
  <Icon {...props}>
    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm2 4v-2H3c0 1.1.9 2 2 2zM3 9h2V7H3v2zm12 12h2v-2h-2v2zm4-18H9a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 12H9V5h10v10zm-8 6h2v-2h-2v2zm-4 0h2v-2H7v2z"/>
  </Icon>
);

export const ToggleBackgroundActiveIcon = (props: JSX.HTMLAttributes) => (
  <Icon {...props}>
    <path d="M9 7H7v2h2V7zm0 4H7v2h2v-2zm0-8a2 2 0 0 0-2 2h2V3zm4 12h-2v2h2v-2zm6-12v2h2a2 2 0 0 0-2-2zm-6 0h-2v2h2V3zM9 17v-2H7c0 1.1.9 2 2 2zm10-4h2v-2h-2v2zm0-4h2V7h-2v2zm0 8a2 2 0 0 0 2-2h-2v2zM5 7H3v12c0 1.1.9 2 2 2h12v-2H5V7zm10-2h2V3h-2v2zm0 12h2v-2h-2v2z"/>
  </Icon>
);

export const RotateIcon = (props: JSX.HTMLAttributes) => (
  <Icon {...props}>
    <path d="M15.6 5.5L11 1v3a8 8 0 0 0 0 16v-2a6 6 0 0 1 0-12v4l4.5-4.5zm4.3 5.5a8 8 0 0 0-1.6-3.9L17 8.5c.5.8.9 1.6 1 2.5h2zM13 17.9v2a8 8 0 0 0 3.9-1.6L15.5 17c-.8.5-1.6.9-2.5 1zm3.9-2.4l1.4 1.4A8 8 0 0 0 20 13h-2c-.1.9-.5 1.7-1 2.5z"/>
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

export const BackIcon = (props: JSX.HTMLAttributes) => (
  <Icon {...props}>
    <path d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20v-2z"/>
  </Icon>
);

const copyAcrossRotations = {
  up: 90, right: 180, down: -90, left: 0,
};

export interface CopyAcrossIconProps extends JSX.HTMLAttributes {
  copyDirection: keyof typeof copyAcrossRotations;
}

export const CopyAcrossIcon = (props: CopyAcrossIconProps) => {
  const { copyDirection, ...otherProps } = props;
  const id = 'point-' + copyDirection;
  const rotation = copyAcrossRotations[copyDirection];

  return (
    <Icon {...otherProps}>
      <defs>
        <clipPath id={id}>
          <path d="M-12-12v24h24v-24zM4.5 2h-4v3l-5-5 5-5v3h4z" transform={`translate(12 13) rotate(${rotation})`}/>
        </clipPath>
      </defs>
      <path clip-path={`url(#${id})`} d="M19 3h-4.2c-.4-1.2-1.5-2-2.8-2s-2.4.8-2.8 2H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-7 0a1 1 0 0 1 0 2c-.6 0-1-.4-1-1s.4-1 1-1z"/>
    </Icon>
  );
};
