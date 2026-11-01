/// <reference path="../../../emscripten-types.d.ts" />

// 1 = grayscale, 2 = RGB, 3 = YCbCr
export type MozJpegColorSpace = 1 | 2 | 3;

export interface EncodeOptions {
  quality: number;
  baseline: boolean;
  arithmetic: boolean;
  progressive: boolean;
  optimize_coding: boolean;
  smoothing: number;
  color_space: MozJpegColorSpace;
  quant_table: number;
  trellis_multipass: boolean;
  trellis_opt_zero: boolean;
  trellis_opt_table: boolean;
  trellis_loops: number;
  auto_subsample: boolean;
  chroma_subsample: number;
  separate_chroma_quality: boolean;
  chroma_quality: number;
}

export interface MozJPEGModule extends EmscriptenWasm.Module {
  encode(
    data: BufferSource,
    width: number,
    height: number,
    options: EncodeOptions,
  ): Uint8Array<ArrayBuffer>;
}

declare var moduleFactory: EmscriptenWasm.ModuleFactory<MozJPEGModule>;

export default moduleFactory;
