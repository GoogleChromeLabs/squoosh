import { nativeResize, NativeResizeMethod, drawableToImageData } from '../../lib/util';
import { BitmapResizeOptions, VectorResizeOptions } from './processor-meta';

function getContainOffsets(sw: number, sh: number, dw: number, dh: number) {
  const currentAspect = sw / sh;
  const endAspect = dw / dh;

  if (endAspect > currentAspect) {
    const newSh = sw / endAspect;
    const newSy = (sh - newSh) / 2;
    return { sw, sh: newSh, sx: 0, sy: newSy };
  }

  const newSw = sh * endAspect;
  const newSx = (sw - newSw) / 2;
  return { sh, sw: newSw, sx: newSx, sy: 0 };
}

export function resize(data: ImageData, opts: BitmapResizeOptions): ImageData {
  let sx = 0;
  let sy = 0;
  let sw = data.width;
  let sh = data.height;

  if (opts.fitMethod === 'contain') {
    ({ sx, sy, sw, sh } = getContainOffsets(sw, sh, opts.width, opts.height));
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

  if (opts.fitMethod === 'contain') {
    ({ sx, sy, sw, sh } = getContainOffsets(sw, sh, opts.width, opts.height));
  }

  return drawableToImageData(data, {
    sx, sy, sw, sh,
    width: opts.width, height: opts.height,
  });
}
