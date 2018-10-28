type ModuleFactory<M extends EmscriptenWasm.Module> = (
  opts: EmscriptenWasm.ModuleOpts,
) => M;

export function initWasmModule<T extends EmscriptenWasm.Module>(
  moduleFactory: ModuleFactory<T>,
  wasmUrl: string,
): Promise<T> {
  return new Promise((resolve) => {
    const module = moduleFactory({
      // Just to be safe, don't automatically invoke any wasm functions
      noInitialRun: true,
      locateFile(url: string): string {
        // Redirect the request for the wasm binary to whatever webpack gave us.
        if (url.endsWith('.wasm')) return wasmUrl;
        return url;
      },
      onRuntimeInitialized() {
        // An Emscripten is a then-able that resolves with itself, causing an infite loop when you
        // wrap it in a real promise. Delete the `then` prop solves this for now.
        // https://github.com/kripken/emscripten/issues/5820
        delete (module as any).then;
        resolve(module);
      },
    });
  });
}
