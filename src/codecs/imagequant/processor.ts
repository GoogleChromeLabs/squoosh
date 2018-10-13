import imagequant, { QuantizerModule } from '../../../codecs/imagequant/imagequant';
import wasmUrl from '../../../codecs/imagequant/imagequant.wasm';
import { QuantizeOptions } from './processor-meta';

let emscriptenModule: Promise<QuantizerModule>;

function initModule(): Promise<QuantizerModule> {
  return new Promise((resolve) => {
    const m = imagequant({
      // Just to be safe, don’t automatically invoke any wasm functions
      noInitialRun: false,
      locateFile(url: string): string {
        // Redirect the request for the wasm binary to whatever webpack gave us.
        if (url.endsWith('.wasm')) return wasmUrl;
        return url;
      },
      onRuntimeInitialized() {
        // An Emscripten is a then-able that, for some reason, `then()`s itself,
        // causing an infite loop when you wrap it in a real promise. Deleten the `then`
        // prop solves this for now.
        // See: https://github.com/kripken/emscripten/blob/incoming/src/postamble.js#L129
        // TODO(surma@): File a bug with Emscripten on this.
        delete (m as any).then;
        resolve(m);
      },
    });
  });
}

export async function process(data: ImageData, opts: QuantizeOptions): Promise<ImageData> {
  if (!emscriptenModule) emscriptenModule = initModule();

  const module = await emscriptenModule;

  const result = opts.zx ?
      module.zx_quantize(data.data, data.width, data.height, opts.dither)
    :
      module.quantize(data.data, data.width, data.height, opts.maxNumColors, opts.dither);

  module.free_result();

  return new ImageData(new Uint8ClampedArray(result.buffer), result.width, result.height);
}
