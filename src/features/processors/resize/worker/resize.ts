import { WorkerResizeOptions } from '../shared';
import { getContainOffsets } from '../shared/util';
import initWasm, { resize as wasmResize } from 'codecs/resize/pkg';
import wasmUrl from 'url:codecs/resize/pkg/squoosh_resize_bg.wasm';

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

let wasmReady: Promise<unknown>;

export default async function resize(
  data: ImageData,
  opts: WorkerResizeOptions,
): Promise<ImageData> {
  if (!wasmReady) {
    wasmReady = initWasm(wasmUrl);
  }

  await wasmReady;

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
