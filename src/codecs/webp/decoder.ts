import webp_dec, { WebPModule } from '../../../codecs/webp_dec/webp_dec';
import wasmUrl from '../../../codecs/webp_dec/webp_dec.wasm';

let emscriptenModule: Promise<WebPModule>;

function initModule(): Promise<WebPModule> {
  return new Promise((resolve) => {
    const m = webp_dec({
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

export async function decode(data: ArrayBuffer): Promise<ImageData> {
  if (!emscriptenModule) emscriptenModule = initModule();

  const module = await emscriptenModule;
  const rawImage = module.decode(data);
  const result = new ImageData(
    new Uint8ClampedArray(rawImage.buffer),
    rawImage.width,
    rawImage.height,
  );

  module.free_result();
  return result;
}
