import mozjpeg_enc, { MozJPEGModule } from '../../../codecs/mozjpeg/enc/mozjpeg_enc';
import wasmUrl from '../../../codecs/mozjpeg/enc/mozjpeg_enc.wasm';
import { EncodeOptions } from './encoder-meta';
import { initEmscriptenModule } from '../util';

let emscriptenModule: Promise<MozJPEGModule>;

export async function encode(data: ImageData, options: EncodeOptions): Promise<ArrayBuffer> {
  if (!emscriptenModule) emscriptenModule = initEmscriptenModule(mozjpeg_enc, wasmUrl);

  const module = await emscriptenModule;
  const resultView = module.encode(data.data, data.width, data.height, options);
  // wasm can’t run on SharedArrayBuffers, so we hard-cast to ArrayBuffer.
  return resultView.buffer as ArrayBuffer;
}
