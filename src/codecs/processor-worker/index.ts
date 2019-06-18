import { expose } from 'comlink';
import { isHqx } from '../resize/processor-meta';
import { clamp } from '../util';

async function mozjpegEncode(
  data: ImageData, options: import('../mozjpeg/encoder-meta').EncodeOptions,
): Promise<ArrayBuffer> {
  const { encode } = await import(
    /* webpackChunkName: "process-mozjpeg-enc" */
    '../mozjpeg/encoder');
  return encode(data, options);
}

async function quantize(
  data: ImageData, opts: import('../imagequant/processor-meta').QuantizeOptions,
): Promise<ImageData> {
  const { process } = await import(
    /* webpackChunkName: "process-imagequant" */
    '../imagequant/processor');
  return process(data, opts);
}

async function rotate(
  data: ImageData, opts: import('../rotate/processor-meta').RotateOptions,
): Promise<ImageData> {
  const { rotate } = await import(
    /* webpackChunkName: "process-rotate" */
    '../rotate/processor');

  return rotate(data, opts);
}

async function resize(
  data: ImageData, opts: import('../resize/processor-meta').WorkerResizeOptions,
): Promise<ImageData> {
  if (isHqx(opts)) {
    const { hqx } = await import(
      /* webpackChunkName: "process-hqx" */
      '../hqx/processor');

    const widthRatio = opts.width / data.width;
    const heightRatio = opts.height / data.height;
    const ratio = Math.max(widthRatio, heightRatio);
    if (ratio <= 1) return data;
    const factor = clamp(Math.ceil(ratio), { min: 2, max: 4 }) as 2|3|4;
    return hqx(data, { factor });
  }
  const { resize } = await import(
    /* webpackChunkName: "process-resize" */
    '../resize/processor');

  return resize(data, opts);
}

async function optiPngEncode(
  data: BufferSource, options: import('../optipng/encoder-meta').EncodeOptions,
): Promise<ArrayBuffer> {
  const { compress } = await import(
    /* webpackChunkName: "process-optipng" */
    '../optipng/encoder');
  return compress(data, options);
}

async function webpEncode(
  data: ImageData, options: import('../webp/encoder-meta').EncodeOptions,
): Promise<ArrayBuffer> {
  const { encode } = await import(
    /* webpackChunkName: "process-webp-enc" */
    '../webp/encoder');
  return encode(data, options);
}

async function webpDecode(data: ArrayBuffer): Promise<ImageData> {
  const { decode } = await import(
    /* webpackChunkName: "process-webp-dec" */
    '../webp/decoder');
  return decode(data);
}

const exports = {
  mozjpegEncode,
  quantize,
  rotate,
  resize,
  optiPngEncode,
  webpEncode,
  webpDecode,
};
export type ProcessorWorkerApi = typeof exports;

expose(exports, self);
