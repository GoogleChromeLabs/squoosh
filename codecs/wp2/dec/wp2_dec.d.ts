export interface WP2Module extends EmscriptenWasm.Module {
  decode(data: BufferSource): ImageData | null;
}

declare var moduleFactory: EmscriptenWasm.ModuleFactory<WP2Module>;

export default moduleFactory;
