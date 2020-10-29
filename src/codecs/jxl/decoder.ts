import jxl_dec, { JXLModule } from '../../../codecs/jxl/dec/jxl_dec';
import wasmUrl from '../../../codecs/jxl/dec/jxl_dec.wasm';
import { initEmscriptenModule } from '../util';

let emscriptenModule: Promise<JXLModule>;

export async function decode(data: ArrayBuffer): Promise<ImageData> {
  if (!emscriptenModule) emscriptenModule = initEmscriptenModule(jxl_dec, wasmUrl);

  const module = await emscriptenModule;
  return module.decode(data);
}
