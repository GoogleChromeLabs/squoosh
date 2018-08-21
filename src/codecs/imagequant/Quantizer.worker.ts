import { QuantizeOptions } from './quantizer';
import imagequant, { QuantizerModule } from '../../../codecs/imagequant/imagequant';
// Using require() so TypeScript doesn’t complain about this not being a module.
const wasmBinaryUrl = require('../../../codecs/imagequant/imagequant.wasm');

export default class ImageQuant {
  private emscriptenModule: Promise<QuantizerModule>;

  constructor() {
    this.emscriptenModule = new Promise((resolve) => {
      const m = imagequant({
        // Just to be safe, don’t automatically invoke any wasm functions
        noInitialRun: false,
        locateFile(url: string): string {
          // Redirect the request for the wasm binary to whatever webpack gave us.
          if (url.endsWith('.wasm')) {
            return wasmBinaryUrl;
          }
          return url;
        },
        onRuntimeInitialized() {
          // An Emscripten is a then-able that, for some reason, `then()`s itself,
          // causing an infite loop when you wrap it in a real promise. Deleting the `then`
          // prop solves this for now.
          // See: https://github.com/kripken/emscripten/blob/incoming/src/postamble.js#L129
          // TODO(surma@): File a bug with Emscripten on this.
          delete (m as any).then;
          resolve(m);
        },
      });
    });
  }

  async quantize(data: ImageData, opts: QuantizeOptions): Promise<ImageData> {
    const m = await this.emscriptenModule;

    const result = opts.zx ?
        m.zx_quantize(data.data, data.width, data.height, opts.dither)
      :
        m.quantize(data.data, data.width, data.height, opts.maxNumColors, opts.dither);

    m.free_result();

    return new ImageData(new Uint8ClampedArray(result.buffer), result.width, result.height);
  }
}
