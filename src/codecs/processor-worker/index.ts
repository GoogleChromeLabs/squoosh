import { expose } from 'comlink';
import { isHqx } from '../resize/processor-meta';
import { clamp } from '../util';

function timed<T>(name: string, func: () => Promise<T>) {
  console.time(name);
  return func().finally(() => console.timeEnd(name));
}

async function mozjpegEncode(
  data: ImageData, options: import('../mozjpeg/encoder-meta').EncodeOptions,
): Promise<ArrayBuffer> {
  const { encode } = await import(
    /* webpackChunkName: "process-mozjpeg-enc" */
    '../mozjpeg/encoder');
  return timed('mozjpegEncode', () => encode(data, options));
}

async function quantize(
  data: ImageData, opts: import('../imagequant/processor-meta').QuantizeOptions,
): Promise<ImageData> {
  const { process } = await import(
    /* webpackChunkName: "process-imagequant" */
    '../imagequant/processor');
  return timed('quantize', () => process(data, opts));
}

async function rotate(
  data: ImageData, opts: import('../rotate/processor-meta').RotateOptions,
): Promise<ImageData> {
  const { rotate } = await import(
    /* webpackChunkName: "process-rotate" */
    '../rotate/processor');

  return timed('rotate', () => rotate(data, opts));
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
    return timed('hqx', () => hqx(data, { factor }));
  }
  const { resize } = await import(
    /* webpackChunkName: "process-resize" */
    '../resize/processor');

  return timed('resize', () => resize(data, opts));
}

async function oxiPngEncode(
  data: ArrayBuffer, options: import('../oxipng/encoder-meta').EncodeOptions,
): Promise<ArrayBuffer> {
  const { compress } = await import(
    /* webpackChunkName: "process-oxipng" */
    '../oxipng/encoder');
  return timed('oxiPngEncode', () => compress(data, options));
}

async function webpEncode(
  data: ImageData, options: import('../webp/encoder-meta').EncodeOptions,
): Promise<ArrayBuffer> {
  const { encode } = await import(
    /* webpackChunkName: "process-webp-enc" */
    '../webp/encoder');
  return timed('webpEncode', () => encode(data, options));
}

async function webpDecode(data: ArrayBuffer): Promise<ImageData> {
  const { decode } = await import(
    /* webpackChunkName: "process-webp-dec" */
    '../webp/decoder');
  return timed('webpDecode', () => decode(data));
}

async function wp2Encode(
  data: ImageData, options: import('../wp2/encoder-meta').EncodeOptions,
): Promise<ArrayBuffer> {
  const { encode } = await import(
    /* webpackChunkName: "process-wp2-enc" */
    '../wp2/encoder');
  return encode(data, options);
}

async function wp2Decode(data: ArrayBuffer): Promise<ImageData> {
  const { decode } = await import(
    /* webpackChunkName: "process-wp2-dec" */
    '../wp2/decoder');
  return decode(data);
}

async function avifEncode(
  data: ImageData, options: import('../avif/encoder-meta').EncodeOptions,
): Promise<ArrayBuffer> {
  const { encode } = await import(
    /* webpackChunkName: "process-avif-enc" */
    '../avif/encoder');
  return timed('avifEncode', () => encode(data, options));
}

async function avifDecode(data: ArrayBuffer): Promise<ImageData> {
  const { decode } = await import(
    /* webpackChunkName: "process-avif-dec" */
    '../avif/decoder');
  return timed('avifDencode', () => decode(data));
}

async function jxlEncode(
  data: ImageData, options: import('../jxl/encoder-meta').EncodeOptions,
): Promise<ArrayBuffer> {
  const { encode } = await import(
    /* webpackChunkName: "process-jxl-enc" */
    '../jxl/encoder');
  return timed('jxlEncode', () => encode(data, options));
}

async function jxlDecode(data: ArrayBuffer): Promise<ImageData> {
  const { decode } = await import(
    /* webpackChunkName: "process-jxl-dec" */
    '../jxl/decoder');
  return timed('jxlDecode', () => decode(data));
}

const exports = {
  mozjpegEncode,
  quantize,
  rotate,
  resize,
  oxiPngEncode,
  webpEncode,
  webpDecode,
  wp2Encode,
  wp2Decode,
  avifEncode,
  avifDecode,
  jxlEncode,
  jxlDecode,
};
export type ProcessorWorkerApi = typeof exports;

expose(exports, self);
