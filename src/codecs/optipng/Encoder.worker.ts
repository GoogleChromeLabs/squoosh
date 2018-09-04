import optipng, { OptiPngModule } from '../../../codecs/optipng/optipng';
// Using require() so TypeScript doesn’t complain about this not being a module.
import { EncodeOptions } from './encoder';
const wasmBinaryUrl = require('../../../codecs/optipng/optipng.wasm');

export default class OptiPng {
  private emscriptenModule: Promise<OptiPngModule>;

  constructor() {
    this.emscriptenModule = new Promise((resolve) => {
      const m = optipng({
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

  async compress(data: BufferSource, opts: EncodeOptions): Promise<ArrayBuffer> {
    const m = await this.emscriptenModule;
    const result = m.compress(data, opts);
    const copy = new Uint8Array(result).buffer as ArrayBuffer;
    m.free_result();
    return copy;
  }
}
