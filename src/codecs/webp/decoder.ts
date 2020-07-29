import webp_dec, { WebPModule } from '../../../codecs/webp/dec/webp_dec';
import wasmUrl from '../../../codecs/webp/dec/webp_dec.wasm';
import { initEmscriptenModule } from '../util';

let emscriptenModule: Promise<WebPModule>;

export async function decode(data: ArrayBuffer): Promise<ImageData> {
  if (!emscriptenModule) emscriptenModule = initEmscriptenModule(webp_dec, wasmUrl);

  const module = await emscriptenModule;
  return module.decode(data);
}
