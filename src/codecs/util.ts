type ModuleFactory<M extends EmscriptenWasm.Module> = (
  opts: EmscriptenWasm.ModuleOpts,
) => M;

export function initWasmModule<T extends EmscriptenWasm.Module>(
  moduleFactory: ModuleFactory<T>,
  wasmUrl: string,
): Promise<T> {
  return new Promise((resolve) => {
    const module = moduleFactory({
      // Just to be safe, don’t automatically invoke any wasm functions
      noInitialRun: false,
      locateFile(url: string): string {
        // Redirect the request for the wasm binary to whatever webpack gave us.
        if (url.endsWith('.wasm')) return wasmUrl;
        return url;
      },
      onRuntimeInitialized() {
        // An Emscripten is a then-able that resolves with itself, causing an infite loop when you
        // wrap it in a real promise. Delete the `then` prop solves this for now.
        // See: https://github.com/kripken/emscripten/blob/incoming/src/postamble.js#L129
        // TODO(surma@): File a bug with Emscripten on this.
        delete (module as any).then;
        resolve(module);
      },
    });
  });
}
