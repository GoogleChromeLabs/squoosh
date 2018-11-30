type BitmapResizeMethods = 'browser-pixelated' | 'browser-low' | 'browser-medium' | 'browser-high';

export interface ResizeOptions {
  width: number;
  height: number;
  method: 'vector' | BitmapResizeMethods;
  fitMethod: 'stretch' | 'contain';
}

export interface BitmapResizeOptions extends ResizeOptions {
  method: BitmapResizeMethods;
}

export interface VectorResizeOptions extends ResizeOptions {
  method: 'vector';
}

export const defaultOptions: ResizeOptions = {
  // Width and height will always default to the image size.
  // This is set elsewhere.
  width: 1,
  height: 1,
  // This will be set to 'vector' if the input is SVG.
  method: 'browser-high',
  fitMethod: 'stretch',
};
