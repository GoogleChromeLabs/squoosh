export interface RotateFlipOptions {
  rotate: 0 | 90 | 180 | 270;
  flipHorizontal: boolean;
  flipVertical: boolean;
}

export const defaultOptions: RotateFlipOptions = {
  rotate: 0,
  flipHorizontal: false,
  flipVertical: false,
};
