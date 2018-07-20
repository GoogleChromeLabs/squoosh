import webp_enc, { WebPModule } from '../../../codecs/webp_enc/webp_enc';
// Using require() so TypeScript doesn’t complain about this not being a module.
import { EncodeOptions } from './encoder';
const wasmBinaryUrl = require('../../../codecs/webp_enc/webp_enc.wasm');

// API exposed by wasm module. Details in the codec’s README.
interface ModuleAPI {
  version(): number;
  create_buffer(width: number, height: number): number;
  destroy_buffer(pointer: number): void;
  encode(buffer: number, width: number, height: number, quality: number): void;
  free_result(): void;
  get_result_pointer(): number;
  get_result_size(): number;
}

export default class WebPEncoder {
  private emscriptenModule: Promise<WebPModule>;

  constructor() {
    this.emscriptenModule = new Promise((resolve) => {
      const m = webp_enc({
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

  async encode(data: ImageData, options: EncodeOptions): Promise<ArrayBuffer> {
    const module = await this.emscriptenModule;

    const p = module.create_buffer(data.width, data.height);
    module.HEAP8.set(data.data, p);
    module.encode(p, data.width, data.height, options);
    const resultPointer = module.get_result_pointer();
    const resultSize = module.get_result_size();
    const resultView = new Uint8Array(module.HEAP8.buffer, resultPointer, resultSize);
    const result = new Uint8Array(resultView);
    module.free_result();
    module.destroy_buffer(p);

    // wasm can’t run on SharedArrayBuffers, so we hard-cast to ArrayBuffer.
    return result.buffer as ArrayBuffer;
  }
}
