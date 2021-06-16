import { fileURLToPath } from 'url';

export function pathify(path: string): string {
  if (path.startsWith('file://')) {
    path = fileURLToPath(path);
  }
  return path;
}

export function instantiateEmscriptenWasm<T extends EmscriptenWasm.Module>(
  factory: EmscriptenWasm.ModuleFactory<T>,
  path: string,
): Promise<T> {
  return factory({
    locateFile() {
      return pathify(path);
    },
  });
}
