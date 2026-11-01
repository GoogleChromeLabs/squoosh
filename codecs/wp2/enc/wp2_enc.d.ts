/// <reference path="../../../emscripten-types.d.ts" />

export interface EncodeOptions {
  quality: number;
  alpha_quality: number;
  effort: number;
  pass: number;
  sns: number;
  uv_mode: UVMode;
  csp_type: Csp;
  error_diffusion: number;
  use_random_matrix: boolean;
}

// 0 = adapt (mix of 420 and 444 per block), 1 = all blocks 420,
// 2 = all blocks 444, 3 = auto (choose any of the above)
export type UVMode = 0 | 1 | 2 | 3;

// 0 = YCoCg, 1 = YCbCr, 2 = custom, 3 = YIQ
export type Csp = 0 | 1 | 2 | 3;

export interface WP2Module extends EmscriptenWasm.Module {
  encode(
    data: BufferSource,
    width: number,
    height: number,
    options: EncodeOptions,
  ): Uint8Array<ArrayBuffer> | null;
}

declare var moduleFactory: EmscriptenWasm.ModuleFactory<WP2Module>;

export default moduleFactory;
