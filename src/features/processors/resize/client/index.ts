import {
  builtinResize,
  BuiltinResizeMethod,
  drawableToImageData,
} from 'client/lazy-app/util';
import {
  BrowserResizeOptions,
  VectorResizeOptions,
  WorkerResizeOptions,
  Options,
  workerResizeMethods,
} from '../shared/meta';
import { getContainOffsets } from '../shared/util';
import type { SourceImage } from 'client/lazy-app/Compress';
import type WorkerBridge from 'client/lazy-app/worker-bridge';

/**
 * Return whether a set of options are worker resize options.
 *
 * @param opts
 */
function isWorkerOptions(opts: Options): opts is WorkerResizeOptions {
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
  source: SourceImage,
  options: Options,
  workerBridge: WorkerBridge,
) {
  if (options.method === 'vector') {
    if (!source.vectorImage) throw Error('No vector image available');
    return vectorResize(source.vectorImage, options);
  }
  if (isWorkerOptions(options)) {
    return workerBridge.resize(signal, source.processed, options);
  }
  return browserResize(source.processed, options);
}
