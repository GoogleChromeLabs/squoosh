import wp2_dec, { WP2Module } from '../../../codecs/wp2/dec/wp2_dec';
import wasmUrl from '../../../codecs/wp2/dec/wp2_dec.wasm';
import { initEmscriptenModule } from '../util';

let emscriptenModule: Promise<WP2Module>;

export async function decode(data: ArrayBuffer): Promise<ImageData> {
  if (!emscriptenModule) emscriptenModule = initEmscriptenModule(wp2_dec, wasmUrl);

  const module = await emscriptenModule;
  const rawImage = module.decode(data);
  const result = new ImageData(
    new Uint8ClampedArray(rawImage.buffer),
    rawImage.width,
    rawImage.height,
  );

  module.free_result();
  return result;
}
