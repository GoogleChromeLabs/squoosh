// Order must match the ChromaSubsample enum in jpegli_enc.cpp.
export const enum JpegliChromaSubsample {
  YCbCr444 = 0,
  YCbCr422,
  YCbCr440,
  YCbCr420,
}

export interface EncodeOptions {
  quality: number;
  progressiveLevel: number;
  chromaSubsampling: JpegliChromaSubsample;
}

export interface JpegliModule extends EmscriptenWasm.Module {
  encode(
    data: BufferSource,
    width: number,
    height: number,
    options: EncodeOptions,
  ): Uint8Array | null;
}

declare var moduleFactory: EmscriptenWasm.ModuleFactory<JpegliModule>;

export default moduleFactory;
