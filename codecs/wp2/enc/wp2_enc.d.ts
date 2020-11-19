export interface EncodeOptions {
  quality: number;
  alpha_quality: number;
  speed: number;
  pass: number;
  sns: number;
}

export interface WP2Module extends EmscriptenWasm.Module {
  encode(
    data: BufferSource,
    width: number,
    height: number,
    options: EncodeOptions,
  ): Uint8Array | null;
}

declare var moduleFactory: EmscriptenWasm.ModuleFactory<WP2Module>;

export default moduleFactory;
