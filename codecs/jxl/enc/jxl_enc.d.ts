export interface EncodeOptions {
  quality: number;
  /** 0-100 quality for the alpha channel, or -1 to match `quality`. */
  qualityAlpha: number;
  lossless: boolean;
  effort: number;
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
