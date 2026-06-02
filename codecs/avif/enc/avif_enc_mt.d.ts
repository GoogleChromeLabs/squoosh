export const enum AVIFTune {
  auto,
  psnr,
  ssim,
  iq,
}

export interface EncodeOptions {
  quality: number;
  qualityAlpha: number;
  denoiseLevel: number;
  speed: number;
  subsample: number;
  aqMode: number;
  enableSharpYUV: boolean;
  tune: AVIFTune;
  channelDepth: number;
  premultiplyAlpha: boolean;
  progressive: boolean;
  progressiveQuality: number;
  scalingMode: number;
  blur: number;
  previewProgressiveFrame: boolean;
  independentMainLayer: boolean;
}

export interface AVIFModule extends EmscriptenWasm.Module {
  encode(
    data: BufferSource,
    width: number,
    height: number,
    options: EncodeOptions,
  ): Uint8Array | null;
}

declare var moduleFactory: EmscriptenWasm.ModuleFactory<AVIFModule>;

export default moduleFactory;
