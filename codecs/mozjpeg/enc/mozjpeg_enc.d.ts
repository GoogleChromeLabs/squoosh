export const enum MozJpegColorSpace {
  GRAYSCALE = 1,
  RGB,
  YCbCr,
}

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

export interface MozJPEGModuleExports {
  memory: WebAssembly.Memory;
  alloc(size: number): number;
  dealloc(ptr: number): void;
  encode(
    data: number,
    width: number,
    height: number
  ): number;
  set_opts_quality( quality: number): void;
  set_opts_baseline( baseline: boolean): void;
  set_opts_arithmetic( arithmetic: boolean): void;
  set_opts_progressive( progressive: boolean): void;
  set_opts_optimize_coding( optimize_coding: boolean): void;
  set_opts_smoothing( smoothing: number): void;
  set_opts_color_space( color_space: number): void;
  set_opts_quant_table( quant_table: number): void;
  set_opts_trellis_multipass( trellis_multipass: boolean): void;
  set_opts_trellis_opt_zero( trellis_opt_zero: boolean): void;
  set_opts_trellis_opt_table( trellis_opt_table: boolean): void;
  set_opts_trellis_loops( trellis_loops: number): void;
  set_opts_auto_subsample( auto_subsample: boolean): void;
  set_opts_chroma_subsample( chroma_subsample: number): void;
  set_opts_separate_chroma_quality( separate_chroma_quality: boolean): void;
  set_opts_chroma_quality( chroma_quality: number): void;
}