import webp_enc from '../../../codecs/webp_enc/webp_enc';
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
  private emscriptenModule: Promise<EmscriptenWasm.Module>;
  private api: Promise<ModuleAPI>;

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

    this.api = (async () => {
      // Not sure why, but TypeScript complains that I am using
      // `emscriptenModule` before it’s getting assigned, which is clearly not
      // true :shrug: Using `any`
      const module = await (this as any).emscriptenModule as EmscriptenWasm.Module;

      return {
        version: module.cwrap('version', 'number', []),
        create_buffer: module.cwrap('create_buffer', 'number', ['number', 'number']),
        destroy_buffer: module.cwrap('destroy_buffer', '', ['number']),
        encode: module.cwrap('encode', '', ['number', 'number', 'number', 'number']),
        free_result: module.cwrap('free_result', '', []),
        get_result_pointer: module.cwrap('get_result_pointer', 'number', []),
        get_result_size: module.cwrap('get_result_size', 'number', []),
      };
    })();
  }

  async encode(data: ImageData, options: EncodeOptions): Promise<ArrayBuffer> {
    const m = await this.emscriptenModule;
    const api = await this.api;

    const p = api.create_buffer(data.width, data.height);
    m.HEAP8.set(data.data, p);
    api.encode(p, data.width, data.height, options.quality);
    const resultPointer = api.get_result_pointer();
    const resultSize = api.get_result_size();
    const resultView = new Uint8Array(m.HEAP8.buffer, resultPointer, resultSize);
    const result = new Uint8Array(resultView);
    api.free_result();
    api.destroy_buffer(p);

    // wasm can’t run on SharedArrayBuffers, so we hard-cast to ArrayBuffer.
    return result.buffer as ArrayBuffer;
  }
}
