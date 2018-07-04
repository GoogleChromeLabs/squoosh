import webp_dec from '../../../codecs/webp_dec/webp_dec';
// Using require() so TypeScript doesn’t complain about this not being a module.
const wasmBinaryUrl = require('../../../codecs/webp_dec/webp_dec.wasm');

// API exposed by wasm module. Details in the codec’s README.
interface ModuleAPI {
  version(): number;
  create_buffer(size: number): number;
  destroy_buffer(pointer: number): void;
  decode(buffer: number, size: number): void;
  free_result(): void;
  get_result_pointer(): number;
  get_result_width(): number;
  get_result_height(): number;
}

export default class WebpDecoder {
  private emscriptenModule: Promise<EmscriptenWasm.Module>;
  private api: Promise<ModuleAPI>;

  constructor() {
    this.emscriptenModule = new Promise((resolve) => {
      const m = webp_dec({
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
      const m = await (this as any).emscriptenModule;
      return {
        version: m.cwrap('version', 'number', []),
        create_buffer: m.cwrap('create_buffer', 'number', ['number']),
        destroy_buffer: m.cwrap('destroy_buffer', '', ['number']),
        decode: m.cwrap('decode', '', ['number', 'number']),
        free_result: m.cwrap('free_result', '', []),
        get_result_pointer: m.cwrap('get_result_pointer', 'number', []),
        get_result_height: m.cwrap('get_result_height', 'number', []),
        get_result_width: m.cwrap('get_result_width', 'number', []),
      };
    })();
  }

  async decode(data: ArrayBuffer): Promise<ImageData> {
    const m = await this.emscriptenModule;
    const api = await this.api;

    const p = api.create_buffer(data.byteLength);
    m.HEAP8.set(new Uint8Array(data), p);
    api.decode(p, data.byteLength);
    const resultPointer = api.get_result_pointer();
    const resultWidth = api.get_result_width();
    const resultHeight = api.get_result_height();
    const resultView = new Uint8Array(
      m.HEAP8.buffer,
      resultPointer,
      resultWidth * resultHeight * 4,
    );
    const result = new Uint8ClampedArray(resultView);
    api.free_result();
    api.destroy_buffer(p);

    return new ImageData(result, resultWidth, resultHeight);
  }
}
