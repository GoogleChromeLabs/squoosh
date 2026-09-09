import { WorkerResizeOptions, defaultOptions } from '../shared/meta';
import initResizeWasm, {
  resize as wasmResize,
  ResizeFilter,
} from 'codecs/resize/pkg/squoosh_resize';
import initHqxWasm, { resize as wasmHqx } from 'codecs/hqx/pkg';

interface HqxResizeOptions extends WorkerResizeOptions {
  method: 'hqx';
}

function optsIsHqxOpts(opts: WorkerResizeOptions): opts is HqxResizeOptions {
  return opts.method === 'hqx';
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

/**
 * The persisted method names, mapped onto the codec's filter enum. 'hqx' is a
 * separate wasm module that runs as a pre-pass, scaling by a whole number;
 * Catmull-Rom then covers whatever fractional scale is left over.
 */
const resizeFilters: Record<WorkerResizeOptions['method'], ResizeFilter> = {
  triangle: ResizeFilter.Triangle,
  catrom: ResizeFilter.Catrom,
  mitchell: ResizeFilter.Mitchell,
  lanczos3: ResizeFilter.Lanczos,
  box: ResizeFilter.Box,
  hamming: ResizeFilter.Hamming,
  hqx: ResizeFilter.Catrom,
};

let resizeWasmReady: Promise<unknown>;
let hqxWasmReady: Promise<unknown>;

async function hqx(
  input: ImageData,
  opts: HqxResizeOptions,
): Promise<ImageData> {
  if (!hqxWasmReady) {
    hqxWasmReady = initHqxWasm();
  }

  await hqxWasmReady;

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
    new Uint8ClampedArray(result.buffer),
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
  }

  await resizeWasmReady;

  // Settings persisted before these options existed won't have them, and
  // passing undefined through to wasm would arrive as NaN.
  const {
    lanczosRadius = defaultOptions.lanczosRadius,
    centeringX = defaultOptions.centeringX,
    centeringY = defaultOptions.centeringY,
  } = opts;

  const result = wasmResize(
    new Uint8Array(input.data.buffer),
    input.width,
    input.height,
    opts.width,
    opts.height,
    resizeFilters[opts.method],
    lanczosRadius,
    opts.premultiply,
    opts.linearRGB,
    // The codec crops for us, which also keeps the crop in step with the hqx
    // pre-pass having changed the input dimensions.
    opts.fitMethod === 'contain',
    centeringX,
    centeringY,
  );

  return new ImageData(
    new Uint8ClampedArray(result.buffer),
    opts.width,
    opts.height,
  );
}
