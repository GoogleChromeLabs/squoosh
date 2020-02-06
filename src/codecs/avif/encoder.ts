import avif_enc, { AVIFModule } from '../../../codecs/avif_enc/avif_enc';
import wasmUrl from '../../../codecs/avif_enc/avif_enc.wasm';
import { EncodeOptions } from './encoder-meta';
import { initEmscriptenModule } from '../util';

let emscriptenModule: Promise<AVIFModule>;

export async function encode(data: ImageData, options: EncodeOptions): Promise<ArrayBuffer> {
  if (!emscriptenModule) emscriptenModule = initEmscriptenModule(avif_enc, wasmUrl);

  const module = await emscriptenModule;
  const resultView = module.encode(data.data, data.width, data.height);
  const result = new Uint8Array(resultView);
  module.free_result();

  // wasm can’t run on SharedArrayBuffers, so we hard-cast to ArrayBuffer.
  return result.buffer as ArrayBuffer;
}
