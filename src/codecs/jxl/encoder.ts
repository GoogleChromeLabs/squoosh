import jxl_enc, { JXLModule } from '../../../codecs/jxl_enc/jxl_enc';
import wasmUrl from '../../../codecs/jxl_enc/jxl_enc.wasm';
import { EncodeOptions } from './encoder-meta';
import { initEmscriptenModule } from '../util';

let emscriptenModule: Promise<JXLModule>;

export async function encode(data: ImageData, options: EncodeOptions): Promise<ArrayBuffer> {
  if (!emscriptenModule) emscriptenModule = initEmscriptenModule(jxl_enc, wasmUrl);

  const module = await emscriptenModule;
  console.log(options);
  const resultView = module.encode(data.data, data.width, data.height, options);
  const result = new Uint8Array(resultView);
  module.free_result();

  // wasm can’t run on SharedArrayBuffers, so we hard-cast to ArrayBuffer.
  return result.buffer as ArrayBuffer;
}
