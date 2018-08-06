import { QuantizeOptions } from './quantizer';
import imagequant from '../../../codecs/imagequant/imagequant';
// Using require() so TypeScript doesn’t complain about this not being a module.
const wasmBinaryUrl = require('../../../codecs/imagequant/imagequant.wasm');

// API exposed by wasm module. Details in the codec’s README.
interface ModuleAPI {
  version(): number;
  create_buffer(width: number, height: number): number;
  destroy_buffer(pointer: number): void;
  quantize(buffer: number, width: number, height: number, numColors: number, dither: number): void;
  zx_quantize(buffer: number, width: number, height: number, dither: number): void;
  free_result(): void;
  get_result_pointer(): number;
}

export default class ImageQuant {
  private emscriptenModule: Promise<EmscriptenWasm.Module>;
  private api: Promise<ModuleAPI>;

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

    this.api = (async () => {
      // Not sure why, but TypeScript complains that I am using
      // `emscriptenModule` before it’s getting assigned, which is clearly not
      // true :shrug: Using `any`
      const m = await (this as any).emscriptenModule;
      return {
        version: m.cwrap('version', 'number', []),
        create_buffer: m.cwrap('create_buffer', 'number', ['number', 'number']),
        destroy_buffer: m.cwrap('destroy_buffer', '', ['number']),
        quantize: m.cwrap('quantize', '', ['number', 'number', 'number', 'number', 'number']),
        zx_quantize: m.cwrap('zx_quantize', '', ['number', 'number', 'number', 'number']),
        free_result: m.cwrap('free_result', '', []),
        get_result_pointer: m.cwrap('get_result_pointer', 'number', []),
      };
    })();
  }

  async quantize(data: ImageData, opts: QuantizeOptions): Promise<ImageData> {
    const m = await this.emscriptenModule;
    const api = await this.api;

    const p = api.create_buffer(data.width, data.height);
    m.HEAP8.set(new Uint8Array(data.data), p);
    if (opts.zx) {
      api.zx_quantize(p, data.width, data.height, opts.dither);
    } else {
      api.quantize(p, data.width, data.height, opts.maxNumColors, opts.dither);
    }
    const resultPointer = api.get_result_pointer();
    const resultView = new Uint8Array(
      m.HEAP8.buffer,
      resultPointer,
      data.width * data.height * 4,
    );
    const result = new Uint8ClampedArray(resultView);
    api.free_result();
    api.destroy_buffer(p);

    return new ImageData(result, data.width, data.height);
  }
}
