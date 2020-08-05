interface WebPModule extends EmscriptenWasm.Module {
  decode(data: BufferSource): ImageData | null;
}

export default function(opts: EmscriptenWasm.ModuleOpts): WebPModule;
