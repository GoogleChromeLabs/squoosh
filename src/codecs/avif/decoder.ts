import avif_dec, { AVIFModule } from '../../../codecs/avif/dec/avif_dec';
import wasmUrl from '../../../codecs/avif/dec/avif_dec.wasm';
import { initEmscriptenModule } from '../util';

let emscriptenModule: Promise<AVIFModule>;

export async function decode(data: ArrayBuffer): Promise<ImageData> {
  if (!emscriptenModule) emscriptenModule = initEmscriptenModule(avif_dec, wasmUrl);

  const module = await emscriptenModule;
  const result = module.decode(data);
  if (!result) {
    throw new Error('Decoding error');
  }
  return result;
}
