import mainUrl from 'file-loader!../../../codecs/avif/enc/avif_enc.js';
import avif_enc, { AVIFModule } from '../../../codecs/avif/enc/avif_enc.js';
import wasmUrl from '../../../codecs/avif/enc/avif_enc.wasm';
import workerUrl from 'file-loader!../../../codecs/avif/enc/avif_enc.worker.js';
import { EncodeOptions } from './encoder-meta';
import { initEmscriptenModule } from '../util';

let emscriptenModule: Promise<AVIFModule>;

export async function encode(data: ImageData, options: EncodeOptions): Promise<ArrayBuffer> {
  if (!emscriptenModule) {
    emscriptenModule = initEmscriptenModule(
      avif_enc,
      wasmUrl,
      workerUrl,
      mainUrl as unknown as string,
    );
  }

  const module = await emscriptenModule;
  const result = module.encode(data.data, data.width, data.height, options);

  if (!result) {
    throw new Error('Encoding error');
  }

  // wasm can’t run on SharedArrayBuffers, so we hard-cast to ArrayBuffer.
  return result.buffer as ArrayBuffer;
}
