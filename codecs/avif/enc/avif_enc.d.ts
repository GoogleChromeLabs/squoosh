/// <reference path="../../../emscripten-types.d.ts" />

// 0 = auto, 1 = psnr, 2 = ssim
export type AVIFTune = 0 | 1 | 2;

export interface EncodeOptions {
  quality: number;
  qualityAlpha: number;
  denoiseLevel: number;
  tileRowsLog2: number;
  tileColsLog2: number;
  speed: number;
  subsample: number;
  chromaDeltaQ: boolean;
  sharpness: number;
  enableSharpYUV: boolean;
  tune: AVIFTune;
}

export interface AVIFModule extends EmscriptenWasm.Module {
  encode(
    data: BufferSource,
    width: number,
    height: number,
    options: EncodeOptions,
  ): Uint8Array<ArrayBuffer> | null;
}

declare var moduleFactory: EmscriptenWasm.ModuleFactory<AVIFModule>;

export default moduleFactory;
