import wasmUrl from '../../../codecs/resize/pkg/squooshresize_bg.wasm';
// @ts-ignore https://github.com/rustwasm/wasm-bindgen/issues/1390
import init from '../../../codecs/resize/pkg/squooshresize';
import { resize as wasmResize } from '../../../codecs/resize/pkg/squooshresize';
import { WorkerResizeOptions } from './processor-meta';
import { getContainOffsets } from './util';

const ready = init(wasmUrl);

function crop(
  data: ImageData,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
): ImageData {
  const inputPixels = new Uint32Array(data.data.buffer);

  // Copy within the same buffer for speed and memory efficiency.
  for (let y = 0; y < sh; y += 1) {
    const start = (y + sy) * data.width + sx;
    inputPixels.copyWithin(y * sw, start, start + sw);
  }

  return new ImageData(
    new Uint8ClampedArray(inputPixels.buffer.slice(0, sw * sh * 4)),
    sw,
    sh,
  );
}

/** Resize methods by index */
const resizeMethods: WorkerResizeOptions['method'][] = [
  'triangle',
  'catrom',
  'mitchell',
  'lanczos3',
];

export async function resize(
  data: ImageData,
  opts: WorkerResizeOptions,
): Promise<ImageData> {
  let input = data;

  if (opts.fitMethod === 'contain') {
    const { sx, sy, sw, sh } = getContainOffsets(
      data.width,
      data.height,
      opts.width,
      opts.height,
    );
    input = crop(
      input,
      Math.round(sx),
      Math.round(sy),
      Math.round(sw),
      Math.round(sh),
    );
  }

  await ready;

  const result = wasmResize(
    new Uint8Array(input.data.buffer),
    input.width,
    input.height,
    opts.width,
    opts.height,
    resizeMethods.indexOf(opts.method),
    opts.premultiply,
    opts.linearRGB,
  );

  return new ImageData(
    new Uint8ClampedArray(result.buffer),
    opts.width,
    opts.height,
  );
}
