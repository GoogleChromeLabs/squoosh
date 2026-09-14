export interface EncodeOptions {
  quality: number;
  /** 0-100 quality for the alpha channel, or -1 to match `quality`. */
  qualityAlpha: number;
  lossless: boolean;
  effort: number;
  /** Encoding mode: false = VarDCT, true = modular. Only meaningful when lossy. */
  modular: boolean;
  /** "Progressive": maps to progressive_ac in VarDCT, or responsive in modular. */
  progressiveAC: boolean;
  /** Progressive AC using LSB quantization (qprogressive_ac). */
  qProgressiveAC: boolean;
  /** Extra DC passes: 0 off, 1 one pass, 2 two passes. Ignored unless progressiveAC. */
  progressiveDC: number;
  /** Group order: 0 = scanline, 1 = center-first. VarDCT only. */
  groupOrder: number;
  /** Synthesized noise as an ISO film speed: 0 = off, higher = grainier. Lossy only. */
  photonNoiseIso: number;
  /** Decoding speed tier: 0 = default/best density, 4 = fastest to decode. */
  decodingSpeed: number;
}

/**
 * Options for `transcode`, which losslessly recompresses an existing JPEG
 * rather than encoding pixels. Only a subset of `EncodeOptions` applies: the
 * DCT coefficients come from the JPEG, so there's nothing for quality, mode or
 * noise to do.
 */
export interface TranscodeOptions {
  effort: number;
  /** Store jbrd data, so the original JPEG file can be rebuilt byte for byte. */
  storeJpegMetadata: boolean;
  /** Keep the JPEG's Exif/XMP/JUMBF boxes. Ignored when storeJpegMetadata is set. */
  keepMetadata: boolean;
  /** "Progressive": splits the JPEG's AC coefficients over several passes. */
  progressiveAC: boolean;
  /** Group order: 0 = scanline, 1 = center-first. */
  groupOrder: number;
  /** Decoding speed tier: 0 = default/best density, 4 = fastest to decode. */
  decodingSpeed: number;
}

export interface JXLModule extends EmscriptenWasm.Module {
  encode(
    data: BufferSource,
    width: number,
    height: number,
    options: EncodeOptions,
  ): Uint8Array | null;
  /**
   * Losslessly transcode a JPEG to JPEG XL. `data` is the original JPEG file.
   * `width`/`height` only size the thread pool - everything else is read from
   * the JPEG.
   */
  transcode(
    data: BufferSource,
    width: number,
    height: number,
    options: TranscodeOptions,
  ): Uint8Array | null;
}

declare var moduleFactory: EmscriptenWasm.ModuleFactory<JXLModule>;

export default moduleFactory;
