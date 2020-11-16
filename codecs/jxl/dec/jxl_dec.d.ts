export interface JXLModule extends EmscriptenWasm.Module {
  decode(data: BufferSource): ImageData | null;
}

declare var moduleFactory: EmscriptenWasm.ModuleFactory<JXLModule>;

export default moduleFactory;
