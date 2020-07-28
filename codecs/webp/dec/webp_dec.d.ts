interface WebPModule extends EmscriptenWasm.Module {
  decode(data: BufferSource): ImageData;
}

export default function(opts: EmscriptenWasm.ModuleOpts): WebPModule;
