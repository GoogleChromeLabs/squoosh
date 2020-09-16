export function pathify(path) {
  if (path.startsWith("file://")) {
    path = path.slice("file://".length);
  }
  return path;
}
export function instantiateEmscriptenWasm(factory, path) {
  return factory({
    locateFile() {
      return pathify(path);
    }
  });
}
