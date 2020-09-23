export type ModuleFactory<M extends EmscriptenWasm.Module> = (
  opts: EmscriptenWasm.ModuleOpts,
) => Promise<M>;

export function initEmscriptenModule<T extends EmscriptenWasm.Module>(
  moduleFactory: ModuleFactory<T>,
  wasmUrl: string,
  workerUrl?: string,
  mainUrl?: string,
): Promise<T> {
  return moduleFactory({
    mainScriptUrlOrBlob: mainUrl,
    // Just to be safe, don't automatically invoke any wasm functions
    noInitialRun: true,
    locateFile(url: string): string {
      // Redirect the request for the wasm binary to whatever webpack gave us.
      if (url.endsWith('.wasm')) return wasmUrl;
      if (url.endsWith('.worker.js')) return workerUrl!;
      return url;
    },
  });
}

interface ClampOpts {
  min?: number;
  max?: number;
}

export function clamp(x: number, opts: ClampOpts): number {
  return Math.min(Math.max(x, opts.min || Number.MIN_VALUE), opts.max || Number.MAX_VALUE);
}
