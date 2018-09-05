import { bitmapToImageData, createImageBitmapPolyfill } from '../../lib/util';

type CreateImageBitmapResize = 'pixelated' | 'low' | 'medium' | 'high';

export async function resize(data: ImageData, opts: ResizeOptions): Promise<ImageData> {
  let sx = 0;
  let sy = 0;
  let sw = data.width;
  let sh = data.height;

  if (opts.fitMethod === 'cover') {
    const currentAspect = data.width / data.height;
    const endAspect = opts.width / opts.height;
    if (endAspect > currentAspect) {
      sh = opts.height / (opts.width / data.width);
      sy = (data.height - sh) / 2;
    } else {
      sw = opts.width / (opts.height / data.height);
      sx = (data.width - sw) / 2;
    }
  }

  const bmp = await createImageBitmapPolyfill(data, sx, sy, sw, sh, {
    resizeQuality: opts.method.slice('browser-'.length) as CreateImageBitmapResize,
    resizeWidth: opts.width,
    resizeHeight: opts.height,
  });

  return bitmapToImageData(bmp);
}

export interface ResizeOptions {
  width: number;
  height: number;
  method: 'browser-pixelated' | 'browser-low' | 'browser-medium' | 'browser-high';
  fitMethod: 'stretch' | 'cover';
}

export const defaultOptions: ResizeOptions = {
  // Width and height will always default to the image size.
  // This is set elsewhere.
  width: 1,
  height: 1,
  method: 'browser-high',
  fitMethod: 'stretch',
};
