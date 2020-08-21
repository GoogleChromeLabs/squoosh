import jxl_enc, { JXLModule } from '../../../codecs/jxl/enc/jxl_enc';
import wasmUrl from '../../../codecs/jxl/enc/jxl_enc.wasm';
import { EncodeOptions } from './encoder-meta';
import { initEmscriptenModule } from '../util';

let emscriptenModule: Promise<JXLModule>;

export async function encode(data: ImageData, options: EncodeOptions): Promise<ArrayBuffer> {
  if (!emscriptenModule) emscriptenModule = initEmscriptenModule(jxl_enc, wasmUrl);

  const module = await emscriptenModule;
  const result = module.encode(data.data, data.width, data.height, options);

  // wasm can’t run on SharedArrayBuffers, so we hard-cast to ArrayBuffer.
  return result.buffer as ArrayBuffer;
}
