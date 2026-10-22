export interface EncodeOptions {
  lossless: boolean;
  /** 0-100. Lossy only. */
  quality: number;
  /** 0-5: jixel's speeds, from UltraFast to ExtraSlow. */
  speed: number;
  /** Lossy only: 1 is a single pass, 2-4 that many VarDCT passes. */
  progressivePasses: number;
  /** Lossless only: the Squeeze transform. */
  progressive: boolean;
  patches: boolean;
  splines: boolean;
  dots: boolean;
  /** 0 = VarDCT, 1 = smallest of VarDCT and modular, 2 = modular. */
  lossyModular: number;
  /** 0 = XYB, 1 = YCbCr, 2 = RGB. */
  codingTransform: number;
  learnedRate: boolean;
  fillInvisible: boolean;
  /** 0 = densest, 2 = fastest to decode. Lossless only. */
  decodingSpeed: number;
  /** Lossy VarDCT only: a progressive DC frame, for early previews. */
  progressiveDC: boolean;
  /** 0 = scanline, 1 = center first, 2 = diagonals. Lossy VarDCT only. */
  groupOrder: number;
  /** The metric lossy decisions are tuned for: 0 = SSIMULACRA2, 1 = ColorVideoVDP. */
  arbiter: number;
}

export interface TranscodeOptions {
  /** 0-5, as EncodeOptions. Only changes the entropy coding. */
  speed: number;
  /** Store what it takes to rebuild the original JPEG byte for byte. */
  jpegReconstruction: boolean;
}

export interface JixelModule extends EmscriptenWasm.Module {
  /**
   * Resolves with the encoded file, or an error message. The encode runs on
   * its own pthread, which is why this is async - see Job in jixel_enc.cpp.
   */
  encode(
    data: BufferSource,
    width: number,
    height: number,
    options: EncodeOptions,
  ): Promise<Uint8Array | string>;
  /** Losslessly transcode a JPEG file to JPEG XL. As `encode`. */
  transcode(
    data: BufferSource,
    options: TranscodeOptions,
  ): Promise<Uint8Array | string>;
}

declare var moduleFactory: EmscriptenWasm.ModuleFactory<JixelModule>;

export default moduleFactory;
