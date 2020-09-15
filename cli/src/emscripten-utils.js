export function instantiateEmscriptenWasm(factory, path) {
  if (path.startsWith("file://")) {
    path = path.slice("file://".length);
  }
  return factory({
    locateFile() {
      return path;
    }
  });
}

