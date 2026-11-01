import type { WorkerResizeOptions } from './meta';
import { getContainOffsets } from './util';

interface HqxResizeOptions extends WorkerResizeOptions {
  method: 'hqx';
}

function optsIsHqxOpts(opts: WorkerResizeOptions): opts is HqxResizeOptions {
  return opts.method === 'hqx';
}

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

interface ClampOpts {
  min?: number;
  max?: number;
}

function clamp(
  num: number,
  { min = Number.MIN_VALUE, max = Number.MAX_VALUE }: ClampOpts,
): number {
  return Math.min(Math.max(num, min), max);
}

/** Resize methods by index */
const resizeMethods: WorkerResizeOptions['method'][] = [
  'triangle',
  'catrom',
  'mitchell',
  'lanczos3',
];

async function initResizeWasm() {
  const { default: init, resize } = await import('codecs/resize/pkg');
  await init();
  return resize;
}

async function initHqxWasm() {
  const { default: init, resize } = await import('codecs/hqx/pkg');
  await init();
  return resize;
}

let resizeWasmReady: ReturnType<typeof initResizeWasm>;
let hqxWasmReady: ReturnType<typeof initHqxWasm>;

async function hqx(
  input: ImageData,
  opts: HqxResizeOptions,
): Promise<ImageData> {
  if (!hqxWasmReady) {
    hqxWasmReady = initHqxWasm();
  }

  const wasmHqx = await hqxWasmReady;

  const widthRatio = opts.width / input.width;
  const heightRatio = opts.height / input.height;
  const ratio = Math.max(widthRatio, heightRatio);
  const factor = clamp(Math.ceil(ratio), { min: 1, max: 4 }) as 1 | 2 | 3 | 4;

  if (factor === 1) return input;

  const result = wasmHqx(
    new Uint32Array(input.data.buffer),
    input.width,
    input.height,
    factor,
  );

  return new ImageData(
    new Uint8ClampedArray(result.buffer as ArrayBuffer),
    input.width * factor,
    input.height * factor,
  );
}

export default async function resize(
  data: ImageData,
  opts: WorkerResizeOptions,
): Promise<ImageData> {
  let input = data;

  if (!resizeWasmReady) {
    resizeWasmReady = initResizeWasm();
  }

  if (optsIsHqxOpts(opts)) {
    input = await hqx(input, opts);
    // Regular resize to make up the difference
    opts = { ...opts, method: 'catrom' };
  }

  const wasmResize = await resizeWasmReady;

  if (opts.fitMethod === 'contain') {
    // Use the size of what's being cropped, which hqx may have scaled up.
    const { sx, sy, sw, sh } = getContainOffsets(
      input.width,
      input.height,
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
    new Uint8ClampedArray(result.buffer as ArrayBuffer),
    opts.width,
    opts.height,
  );
}
