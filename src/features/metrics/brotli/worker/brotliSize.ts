import brotli_enc, { BrotliModule } from 'codecs/brotli/enc/brotli_enc';
import { initEmscriptenModule } from 'features/worker-utils';

let emscriptenModule: Promise<BrotliModule>;

/**
 * The size `blob` would be as `Content-Encoding: br`, in bytes.
 *
 * Squoosh presents this instead of the size on disk for vector sources, since
 * a browser downloading an SVG gets the compressed form, and that's the only
 * fair thing to compare the raster encoders' output against.
 */
export default async function brotliSize(blob: Blob): Promise<number> {
  if (!emscriptenModule) emscriptenModule = initEmscriptenModule(brotli_enc);

  const [module, buffer] = await Promise.all([
    emscriptenModule,
    blob.arrayBuffer(),
  ]);

  const size = module.compressed_size(new Uint8Array(buffer));
  if (size < 0) throw Error('Brotli compression failed');
  return size;
}
