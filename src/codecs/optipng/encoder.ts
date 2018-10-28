import optipng, { OptiPngModule } from '../../../codecs/optipng/optipng';
import wasmUrl from '../../../codecs/optipng/optipng.wasm';
import { EncodeOptions } from './encoder-meta';
import { initWasmModule } from '../util';

let emscriptenModule: Promise<OptiPngModule>;

export async function compress(data: BufferSource, options: EncodeOptions): Promise<ArrayBuffer> {
  if (!emscriptenModule) emscriptenModule = initWasmModule(optipng, wasmUrl);

  const module = await emscriptenModule;
  const resultView = module.compress(data, options);
  const result = new Uint8Array(resultView);
  module.free_result();

  // wasm can’t run on SharedArrayBuffers, so we hard-cast to ArrayBuffer.
  return result.buffer as ArrayBuffer;
}
