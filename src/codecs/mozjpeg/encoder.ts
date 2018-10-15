import mozjpeg_enc, { MozJPEGModule } from '../../../codecs/mozjpeg_enc/mozjpeg_enc';
import wasmUrl from '../../../codecs/mozjpeg_enc/mozjpeg_enc.wasm';
import { EncodeOptions } from './encoder-meta';

let emscriptenModule: Promise<MozJPEGModule>;

function initModule(): Promise<MozJPEGModule> {
  return new Promise((resolve) => {
    const m = mozjpeg_enc({
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

export async function encode(data: ImageData, options: EncodeOptions): Promise<ArrayBuffer> {
  if (!emscriptenModule) emscriptenModule = initModule();

  const module = await emscriptenModule;
  const resultView = module.encode(data.data, data.width, data.height, options);
  const result = new Uint8Array(resultView);
  module.free_result();

  // wasm can’t run on SharedArrayBuffers, so we hard-cast to ArrayBuffer.
  return result.buffer as ArrayBuffer;
}
