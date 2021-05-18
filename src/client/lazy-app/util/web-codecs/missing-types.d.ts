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

// I didn’t do all the types because the class is kinda complex.
// I focused on what we need.
declare class VideoFrame {
  codedWidth: number;
  codedHeight: number;
  cropLeft: number;
  cropTop: number;
  cropWidth: number;
  cropHeight: number;
  displayWidth: number;
  displayHeight: number;

  clone(): VideoFrame;
  close(): void;
}

interface CanvasDrawImage {
  drawImage(
    image: CanvasImageSource | VideoFrame,
    dx: number,
    dy: number,
  ): void;
  drawImage(
    image: CanvasImageSource | VideoFrame,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
  ): void;
  drawImage(
    image: CanvasImageSource | VideoFrame,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
  ): void;
}

declare class ImageDecoder {
  static isTypeSupported(type: string): Promise<boolean>;
  constructor(desc: ImageDecoderInit);
  decode(opts?: Partial<ImageDecodeOptions>): Promise<ImageDecodeResult>;
}
