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

export const enum UVMode {
  UVModeAdapt = 0, // Mix of 420 and 444 (per block)
  UVMode420, // All blocks 420
  UVMode444, // All blocks 444
  UVModeAuto, // Choose any of the above automatically
}

export const enum Csp {
  kYCoCg,
  kYCbCr,
  kCustom,
  kYIQ,
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
