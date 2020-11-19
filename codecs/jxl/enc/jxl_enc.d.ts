export interface EncodeOptions {
  speed: number;
  quality: number;
  progressive: boolean;
  epf: number;
  nearLossless: number;
  lossyPalette: boolean;
}

export interface JXLModule extends EmscriptenWasm.Module {
  encode(
    data: BufferSource,
    width: number,
    height: number,
    options: EncodeOptions,
  ): Uint8Array | null;
}

declare var moduleFactory: EmscriptenWasm.ModuleFactory<JXLModule>;

export default moduleFactory;
