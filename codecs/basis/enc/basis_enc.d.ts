export interface EncodeOptions {
  quality: number;
  compression: number;
  uastc: boolean;
  y_flip: boolean;
  mipmap: boolean;
  srgb_mipmap: boolean;
  perceptual: boolean;
}

export interface BasisModule extends EmscriptenWasm.Module {
  encode(
    data: BufferSource,
    width: number,
    height: number,
    options: EncodeOptions,
  ): Uint8Array | null;
}

declare var moduleFactory: EmscriptenWasm.ModuleFactory<BasisModule>;

export default moduleFactory;
