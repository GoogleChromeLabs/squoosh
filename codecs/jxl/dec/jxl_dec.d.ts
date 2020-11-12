interface JXLModule extends EmscriptenWasm.Module {
  decode(data: BufferSource): ImageData | null;
}

export default function (opts: EmscriptenWasm.ModuleOpts): Promise<JXLModule>;
