import jxl_dec, { JXLModule } from '../../../codecs/jxl_dec/jxl_dec';
import wasmUrl from '../../../codecs/jxl_dec/jxl_dec.wasm';
import { initEmscriptenModule } from '../util';

let emscriptenModule: Promise<JXLModule>;

export async function decode(data: ArrayBuffer): Promise<ImageData> {
  if (!emscriptenModule) emscriptenModule = initEmscriptenModule(jxl_dec, wasmUrl);

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
