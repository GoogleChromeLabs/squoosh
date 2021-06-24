import { fileURLToPath, URL } from 'url';

export function pathify(path: string): string {
  if (path.startsWith('file://')) {
    path = fileURLToPath(path);
  }
  return path;
}

export function instantiateEmscriptenWasm<T extends EmscriptenWasm.Module>(
  factory: EmscriptenWasm.ModuleFactory<T>,
  path: string,
  workerWasm: string = '',
): Promise<T> {
  return factory({
    locateFile(requestPath) {
      if (requestPath.endsWith('.wasm')) return pathify(path);
      if (requestPath.endsWith('.worker.js'))
        return new URL(workerWasm).pathname;
      return requestPath;
    },
  });
}
