import mainUrlWithMT from 'file-loader!../../../codecs/avif/enc/avif_enc_mt.js';
import { AVIFModule } from '../../../codecs/avif/enc/avif_enc.js';
import wasmUrlWithoutMT from '../../../codecs/avif/enc/avif_enc.wasm';
import wasmUrlWithMT from '../../../codecs/avif/enc/avif_enc_mt.wasm';
import workerUrl from '../../../codecs/avif/enc/avif_enc_mt.worker.js';
import { EncodeOptions } from './encoder-meta';
import { initEmscriptenModule, ModuleFactory } from '../util';
import { threads } from 'wasm-feature-detect';

declare const avif_enc_mt: ModuleFactory<AVIFModule>;

let emscriptenModule: Promise<AVIFModule>;

async function init() {
  if (await threads()) {
    importScripts(mainUrlWithMT);
    return initEmscriptenModule<AVIFModule>(
      avif_enc_mt,
      wasmUrlWithMT,
      workerUrl,
      mainUrlWithMT,
    );
  }
  return initEmscriptenModule(
    (await import('../../../codecs/avif/enc/avif_enc.js')).default,
    wasmUrlWithoutMT,
  );
}

export async function encode(data: ImageData, options: EncodeOptions): Promise<ArrayBuffer> {
  if (!emscriptenModule) emscriptenModule = init();

  const module = await emscriptenModule;
  const result = module.encode(data.data, data.width, data.height, options);

  if (!result) {
    throw new Error('Encoding error');
  }

  // wasm can’t run on SharedArrayBuffers, so we hard-cast to ArrayBuffer.
  return result.buffer as ArrayBuffer;
}
