type BrowserResizeMethods = 'browser-pixelated' | 'browser-low' | 'browser-medium' | 'browser-high';
type WorkerResizeMethods = 'point' | 'triangle' | 'catrom' | 'mitchell' | 'lanczos3';

export interface ResizeOptions {
  width: number;
  height: number;
  method: 'vector' | BrowserResizeMethods | WorkerResizeMethods;
  fitMethod: 'stretch' | 'contain';
  premultiply: boolean;
}

export interface BrowserResizeOptions extends ResizeOptions {
  method: BrowserResizeMethods;
}

export interface WorkerResizeOptions extends ResizeOptions {
  method: WorkerResizeMethods;
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
  method: 'lanczos3',
  fitMethod: 'stretch',
  premultiply: true,
};
