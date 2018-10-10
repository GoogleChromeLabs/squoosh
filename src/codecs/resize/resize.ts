import { nativeResize, NativeResizeMethod, drawableToImageData } from '../../lib/util';

function getCoverOffsets(sw: number, sh: number, dw: number, dh: number) {
  const currentAspect = sw / sh;
  const endAspect = dw / dh;

  if (endAspect > currentAspect) {
    const newSh = dh / (dw / sw);
    const newSy = (sh - newSh) / 2;
    return { sw, sh: newSh, sx: 0, sy: newSy };
  }

  const newSw = dw / (dh / sh);
  const newSx = (sw - newSw) / 2;
  return { sh, sw: newSw, sx: newSx, sy: 0 };
}

export function resize(data: ImageData, opts: BitmapResizeOptions): ImageData {
  let sx = 0;
  let sy = 0;
  let sw = data.width;
  let sh = data.height;

  if (opts.fitMethod === 'cover') {
    ({ sx, sy, sw, sh } = getCoverOffsets(sw, sh, opts.width, opts.height));
  }

  return nativeResize(
    data, sx, sy, sw, sh, opts.width, opts.height,
    opts.method.slice('browser-'.length) as NativeResizeMethod,
  );
}

export function vectorResize(data: HTMLImageElement, opts: VectorResizeOptions): ImageData {
  let sx = 0;
  let sy = 0;
  let sw = data.width;
  let sh = data.height;

  if (opts.fitMethod === 'cover') {
    ({ sx, sy, sw, sh } = getCoverOffsets(sw, sh, opts.width, opts.height));
  }

  return drawableToImageData(data, {
    sx, sy, sw, sh,
    width: opts.width, height: opts.height,
  });
}

type BitmapResizeMethods = 'browser-pixelated' | 'browser-low' | 'browser-medium' | 'browser-high';

export interface ResizeOptions {
  width: number;
  height: number;
  method: 'vector' | BitmapResizeMethods;
  fitMethod: 'stretch' | 'cover';
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
