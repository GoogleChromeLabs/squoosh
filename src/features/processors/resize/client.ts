import {
  builtinResize,
  type BuiltinResizeMethod,
  drawableToImageData,
} from '@/lib/canvas';
import type WorkerBridge from '@/worker/bridge';
import {
  type BrowserResizeOptions,
  type VectorResizeOptions,
  type WorkerResizeOptions,
  type Options as ResizeOptions,
  workerResizeMethods,
} from './meta';
import { getContainOffsets } from './util';

export interface ResizeSource {
  preprocessed: ImageData;
  vectorImage?: HTMLImageElement;
}

function isWorkerOptions(opts: ResizeOptions): opts is WorkerResizeOptions {
  return (workerResizeMethods as string[]).includes(opts.method);
}

function browserResize(data: ImageData, opts: BrowserResizeOptions): ImageData {
  let sx = 0;
  let sy = 0;
  let sw = data.width;
  let sh = data.height;

  if (opts.fitMethod === 'contain') {
    ({ sx, sy, sw, sh } = getContainOffsets(sw, sh, opts.width, opts.height));
  }

  return builtinResize(
    data,
    sx,
    sy,
    sw,
    sh,
    opts.width,
    opts.height,
    opts.method.slice('browser-'.length) as BuiltinResizeMethod,
  );
}

function vectorResize(
  data: HTMLImageElement,
  opts: VectorResizeOptions,
): ImageData {
  let sx = 0;
  let sy = 0;
  let sw = data.width;
  let sh = data.height;

  if (opts.fitMethod === 'contain') {
    ({ sx, sy, sw, sh } = getContainOffsets(sw, sh, opts.width, opts.height));
  }

  return drawableToImageData(data, {
    sx,
    sy,
    sw,
    sh,
    width: opts.width,
    height: opts.height,
  });
}

export async function resize(
  signal: AbortSignal,
  source: ResizeSource,
  options: ResizeOptions,
  workerBridge: WorkerBridge,
): Promise<ImageData> {
  if (options.method === 'vector') {
    if (!source.vectorImage) throw Error('No vector image available');
    return vectorResize(source.vectorImage, options);
  }
  if (isWorkerOptions(options)) {
    return workerBridge.resize(signal, source.preprocessed, options);
  }
  return browserResize(source.preprocessed, options);
}
