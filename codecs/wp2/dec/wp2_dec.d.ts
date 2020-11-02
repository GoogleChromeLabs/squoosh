interface WP2Module extends EmscriptenWasm.Module {
  decode(data: BufferSource): ImageData | null;
}

export default function(opts: EmscriptenWasm.ModuleOpts): Promise<WP2Module>;
