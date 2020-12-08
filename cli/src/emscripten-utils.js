import { fileURLToPath } from 'url';

export function pathify(path) {
  if (path.startsWith('file://')) {
    path = fileURLToPath(path);
  }
  return path;
}

export function instantiateEmscriptenWasm(factory, path) {
  return factory({
    locateFile() {
      return pathify(path);
    },
  });
}
