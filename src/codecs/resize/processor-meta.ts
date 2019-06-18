type BrowserResizeMethods =
  | 'browser-pixelated'
  | 'browser-low'
  | 'browser-medium'
  | 'browser-high';
type WorkerResizeMethods =
  | 'triangle'
  | 'catrom'
  | 'mitchell'
  | 'lanczos3'
  | 'hqx';
const workerResizeMethods: WorkerResizeMethods[] = [
  'triangle',
  'catrom',
  'mitchell',
  'lanczos3',
  'hqx',
];

export type ResizeOptions =
  | BrowserResizeOptions
  | WorkerResizeOptions
  | VectorResizeOptions;

export interface ResizeOptionsCommon {
  width: number;
  height: number;
  fitMethod: 'stretch' | 'contain';
}

export interface BrowserResizeOptions extends ResizeOptionsCommon {
  method: BrowserResizeMethods;
}

export interface WorkerResizeOptions extends ResizeOptionsCommon {
  method: WorkerResizeMethods;
  premultiply: boolean;
  linearRGB: boolean;
}

export interface VectorResizeOptions extends ResizeOptionsCommon {
  method: 'vector';
}

/**
 * Return whether a set of options are worker resize options.
 *
 * @param opts
 */
export function isWorkerOptions(
  opts: ResizeOptions,
): opts is WorkerResizeOptions {
  return (workerResizeMethods as string[]).includes(opts.method);
}

/**
 * Return whether a set of options are from the HQ<n>X set
 *
 * @param opts
 */
export function isHqx(opts: ResizeOptions): opts is WorkerResizeOptions {
  return opts.method === 'hqx';
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
  linearRGB: true,
};
