import webp_dec, { WebPModule } from '../../../codecs/webp_dec/webp_dec';
// Using require() so TypeScript doesn’t complain about this not being a module.
const wasmBinaryUrl = require('../../../codecs/webp_dec/webp_dec.wasm');

// API exposed by wasm module. Details in the codec’s README.

export default class WebpDecoder {
  private emscriptenModule: Promise<WebPModule>;

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

  async decode(data: ArrayBuffer): Promise<ImageData> {
    const m = await this.emscriptenModule;
    const rawImage = m.decode(data);
    m.free_result();

    return new ImageData(
      new Uint8ClampedArray(rawImage.buffer),
      rawImage.width,
      rawImage.height,
    );
  }
}
