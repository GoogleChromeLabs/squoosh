interface ImageDecoderInit {
  type: string;
  data: BufferSource | ReadableStream;
  premultiplyAlpha?: PremultiplyAlpha;
  colorSpaceConversion?: ColorSpaceConversion;
  desiredWidth?: number;
  desiredHeight?: number;
  preferAnimation?: boolean;
}

interface ImageDecodeOptions {
  frameIndex: number;
  completeFramesOnly: boolean;
}

interface ImageDecodeResult {
  image: VideoFrame;
  complete: boolean;
}

// Absolutely not correct, but it’s all we need and I’m lazy.
type VideoFrame = ImageBitmap;

declare class ImageDecoder {
  static isTypeSupported(type: string): Promise<boolean>;
  constructor(desc: ImageDecoderInit);
  decode(opts?: Partial<ImageDecodeOptions>): Promise<ImageDecodeResult>;
}
