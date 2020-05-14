import imagequant, { QuantizerModule } from '../../../codecs/imagequant/imagequant';
import wasmUrl from '../../../codecs/imagequant/imagequant.wasm';
import { QuantizeOptions } from './processor-meta';
import { initEmscriptenModule } from '../util';

let emscriptenModule: Promise<QuantizerModule>;

export async function process(data: ImageData, opts: QuantizeOptions): Promise<ImageData> {
  if (!emscriptenModule) emscriptenModule = initEmscriptenModule(imagequant, wasmUrl);

  const module = await emscriptenModule;

  const result = opts.zx ?
      module.zx_quantize(data.data, data.width, data.height, opts.dither)
    :
      module.quantize(data.data, data.width, data.height, opts.maxNumColors, opts.dither);

  const imgData = new ImageData(new Uint8ClampedArray(result.buffer), result.width, result.height);

  module.free_result(imgData.data.byteOffset);

  return imgData;
}
