import jpegli_enc, { JpegliModule } from 'codecs/jpegli/enc/jpegli_enc';
import { EncodeOptions } from '../shared/meta';
import { initEmscriptenModule } from 'features/worker-utils';

let emscriptenModule: Promise<JpegliModule>;

export default async function encode(
  data: ImageData,
  options: EncodeOptions,
): Promise<ArrayBuffer> {
  if (!emscriptenModule) {
    emscriptenModule = initEmscriptenModule(jpegli_enc);
  }

  const module = await emscriptenModule;
  const resultView = module.encode(data.data, data.width, data.height, options);
  if (!resultView) throw new Error('Encoding error');
  // wasm can’t run on SharedArrayBuffers, so we hard-cast to ArrayBuffer.
  return resultView.buffer as ArrayBuffer;
}
