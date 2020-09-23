import mainUrl from 'file-loader!../../../codecs/avif/enc/avif_enc.js';
import { AVIFModule } from '../../../codecs/avif/enc/avif_enc.js';
import wasmUrl from '../../../codecs/avif/enc/avif_enc.wasm';
import workerUrl from 'file-loader!../../../codecs/avif/enc/avif_enc.worker.js';
import { EncodeOptions } from './encoder-meta';
import { initEmscriptenModule } from '../util';

declare const avif_enc: typeof import('../../../codecs/avif/enc/avif_enc.js').default;

let emscriptenModule: Promise<AVIFModule>;

async function init() {
  importScripts(mainUrl as unknown as string);
  return initEmscriptenModule<AVIFModule>(
    avif_enc,
    wasmUrl,
    workerUrl,
    mainUrl as unknown as string,
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
