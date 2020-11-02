import wp2_enc, { WP2Module } from '../../../codecs/wp2/enc/wp2_enc';
import wasmUrl from '../../../codecs/wp2/enc/wp2_enc.wasm';
import { EncodeOptions } from './encoder-meta';
import { initEmscriptenModule } from '../util';

let emscriptenModule: Promise<WP2Module>;

export async function encode(data: ImageData, options: EncodeOptions): Promise<ArrayBuffer> {
  if (!emscriptenModule) emscriptenModule = initEmscriptenModule(wp2_enc, wasmUrl);

  const module = await emscriptenModule;
  const result = module.encode(data.data, data.width, data.height, options);

  if (!result) {
    throw new Error('Encoding error');
  }

  // wasm can’t run on SharedArrayBuffers, so we hard-cast to ArrayBuffer.
  return result.buffer as ArrayBuffer;
}
