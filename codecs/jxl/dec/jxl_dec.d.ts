interface JXLModule extends EmscriptenWasm.Module {
  decode(data: BufferSource): ImageData;
}

export default function(opts: EmscriptenWasm.ModuleOpts): JXLModule;
