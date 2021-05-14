export interface EncodeOptions {
  quality: number;
  compression: number;
  uastc: boolean;
  mipmap: boolean;
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
