export interface EncodeOptions {
  quality: number;
  /** 0-100 quality for the alpha channel, or -1 to match `quality`. */
  qualityAlpha: number;
  lossless: boolean;
  effort: number;
  /** Progressive AC (VarDCT) — the flag that makes the image decode in passes. */
  progressiveAC: boolean;
  /** Progressive AC using LSB quantization (qprogressive_ac). */
  qProgressiveAC: boolean;
  /** Extra DC passes: 0 off, 1 one pass, 2 two passes. Ignored unless progressiveAC. */
  progressiveDC: number;
  /** Group order: 0 = scanline, 1 = center-first ("Expand"). */
  groupOrder: number;
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
