import type { QOIModule } from 'codecs/qoi/dec/qoi_dec';
import { initEmscriptenModule, blobToArrayBuffer } from 'features/worker-utils';

let emscriptenModule: Promise<QOIModule>;

export default async function decode(blob: Blob): Promise<ImageData> {
  if (!emscriptenModule) {
    const decoder = await import('codecs/qoi/dec/qoi_dec');
    emscriptenModule = initEmscriptenModule(decoder.default);
  }

  const [module, data] = await Promise.all([
    emscriptenModule,
    blobToArrayBuffer(blob),
  ]);

  const result = module.decode(data);
  if (!result) throw new Error('Decoding error');
  return result;
}
