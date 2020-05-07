import avif_dec, { AVIFModule } from '../../../codecs/avif_dec/avif_dec';
import wasmUrl from '../../../codecs/avif_dec/avif_dec.wasm';
import { initEmscriptenModule } from '../util';

let emscriptenModule: Promise<AVIFModule>;

export async function decode(data: ArrayBuffer): Promise<ImageData> {
  if (!emscriptenModule) emscriptenModule = initEmscriptenModule(avif_dec, wasmUrl);

  const module = await emscriptenModule;
  const rawImage = module.decode(data);
  const result = new ImageData(
    new Uint8ClampedArray(rawImage.buffer),
    rawImage.width,
    rawImage.height,
  );

  return result;
}
