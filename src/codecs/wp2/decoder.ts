import wp2_dec, { WP2Module } from '../../../codecs/wp2/dec/wp2_dec';
import wasmUrl from '../../../codecs/wp2/dec/wp2_dec.wasm';
import { initEmscriptenModule } from '../util';

let emscriptenModule: Promise<WP2Module>;

export async function decode(data: ArrayBuffer): Promise<ImageData> {
  if (!emscriptenModule) emscriptenModule = initEmscriptenModule(wp2_dec, wasmUrl);

  const module = await emscriptenModule;
  const result = module.decode(data);
  if (!result) {
    throw new Error('Decoding error');
  }
  return result;
}
