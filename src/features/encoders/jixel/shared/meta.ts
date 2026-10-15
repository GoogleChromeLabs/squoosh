/**
 * What the encoder is fed. As with the libjxl encoder, 'transcode' recompresses
 * an untouched source JPEG's DCT coefficients rather than encoding pixels - see
 * `transcodeSourceFor` in client/lazy-app/Compress.
 */
export type Mode = 'lossy' | 'lossless' | 'transcode';

/**
 * Which arm codes a lossy image: VarDCT (block DCT), Modular (a quantized
 * Squeeze pyramid, which tends to win on smooth and gradient-heavy content),
 * or 'auto' to encode both and keep the smaller. 'auto' only takes effect at
 * effort 5 and above; below that it's VarDCT.
 */
export type LossyModular = 'off' | 'auto' | 'force';

/** The colour space lossy frames are coded in. */
export type CodingTransform = 'xyb' | 'ycbcr' | 'rgb';

/**
 * The order lossy VarDCT tiles are stored in, which is the order a progressive
 * decoder fills them in. The pixels are the same either way.
 */
export type GroupOrder = 'scanline' | 'center' | 'diagonals';

/** The perceptual metric whose preferences settle lossy encoding decisions. */
export type Arbiter = 'ssimulacra2' | 'cvvdp';

export interface EncodeOptions {
  mode: Mode;
  /** 0-100, lossy only. */
  quality: number;
  /** 1-6: jixel's speeds, from UltraFast to ExtraSlow. */
  effort: number;
  /**
   * Lossy: progressive VarDCT, in `progressivePasses` passes. Lossless: the
   * Squeeze transform, a low-res preview refining to the exact image.
   */
  progressive: boolean;
  /** 2-4, lossy progressive only. */
  progressivePasses: number;
  /** Code repeated content (text, icons, tiles) once via the patch dictionary. */
  patches: boolean;
  /** Experimental: code thin lines as splines. Lossy VarDCT in XYB, effort 5+. */
  splines: boolean;
  /**
   * Experimental: code isolated bright or dark spots (stars, specks) as dots.
   * Lossy VarDCT in XYB, effort 5+. Each dot has to pay for itself, so most
   * images come out unchanged.
   */
  dots: boolean;
  lossyModular: LossyModular;
  codingTransform: CodingTransform;
  /**
   * Choose VarDCT transforms by the image's own coefficient statistics. Lossy,
   * effort 5+.
   */
  learnedRate: boolean;
  /**
   * Keep the colour of fully transparent pixels. Off, jixel replaces it with a
   * smooth fill of the neighbouring visible colours, which can halve the file
   * when there's hidden detail. Lossy only.
   */
  preserveTransparentData: boolean;
  /** 0-2, lossless only. Trades size for decode speed. */
  decodingSpeed: number;
  /**
   * Code the DC as its own squeezed frame, so a decoder can show previews from
   * 1:256 up to 1:8 before any detail arrives. Lossy VarDCT in XYB, and jixel
   * ignores it for images with alpha.
   */
  progressiveDC: boolean;
  /** Lossy VarDCT only. */
  groupOrder: GroupOrder;
  /** Lossy only. ColorVideoVDP makes effort 6 several times slower. */
  arbiter: Arbiter;
  /**
   * Store enough to rebuild the original JPEG byte for byte. Transcode only.
   * Exif and XMP are carried over either way.
   */
  storeJpegMetadata: boolean;
}

export const label = 'JPEG XL (Jixel)';
export const mimeType = 'image/jxl';
export const extension = 'jxl';
export const defaultOptions: EncodeOptions = {
  mode: 'lossy',
  quality: 75,
  // Slow: every coding tool, with the standard search budget.
  effort: 5,
  progressive: false,
  progressivePasses: 2,
  patches: true,
  splines: false,
  dots: false,
  lossyModular: 'off',
  codingTransform: 'xyb',
  learnedRate: true,
  preserveTransparentData: false,
  decodingSpeed: 0,
  progressiveDC: false,
  groupOrder: 'scanline',
  arbiter: 'ssimulacra2',
  storeJpegMetadata: true,
};
