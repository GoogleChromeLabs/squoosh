import { expose } from 'comlink';
import avifDecode from '@/features/decoders/avif/worker';
import jxlDecode from '@/features/decoders/jxl/worker';
import qoiDecode from '@/features/decoders/qoi/worker';
import webpDecode from '@/features/decoders/webp/worker';
import wp2Decode from '@/features/decoders/wp2/worker';
import avifEncode from '@/features/encoders/avif/worker';
import jxlEncode from '@/features/encoders/jxl/worker';
import mozjpegEncode from '@/features/encoders/mozJPEG/worker';
import oxipngEncode from '@/features/encoders/oxiPNG/worker';
import qoiEncode from '@/features/encoders/qoi/worker';
import webpEncode from '@/features/encoders/webP/worker';
import wp2Encode from '@/features/encoders/wp2/worker';
import rotate from '@/features/preprocessors/rotate/worker';
import quantize from '@/features/processors/quantize/worker';
import resize from '@/features/processors/resize/worker';

/** Wraps a worker function so each call is timed in the console. */
function timed<A extends unknown[], R>(
  name: string,
  func: (...args: A) => Promise<R>,
): (...args: A) => Promise<R> {
  return (...args) => {
    console.time(name);
    return func(...args).finally(() => console.timeEnd(name));
  };
}

const api = {
  avifDecode: timed('avifDecode', avifDecode),
  jxlDecode: timed('jxlDecode', jxlDecode),
  qoiDecode: timed('qoiDecode', qoiDecode),
  webpDecode: timed('webpDecode', webpDecode),
  wp2Decode: timed('wp2Decode', wp2Decode),
  avifEncode: timed('avifEncode', avifEncode),
  jxlEncode: timed('jxlEncode', jxlEncode),
  mozjpegEncode: timed('mozjpegEncode', mozjpegEncode),
  oxipngEncode: timed('oxipngEncode', oxipngEncode),
  qoiEncode: timed('qoiEncode', qoiEncode),
  webpEncode: timed('webpEncode', webpEncode),
  wp2Encode: timed('wp2Encode', wp2Encode),
  rotate: timed('rotate', rotate),
  quantize: timed('quantize', quantize),
  resize: timed('resize', resize),
};

export type WorkerApi = typeof api;

expose(api);
