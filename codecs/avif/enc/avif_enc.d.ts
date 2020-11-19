export interface EncodeOptions {
  minQuantizer: number;
  maxQuantizer: number;
  minQuantizerAlpha: number;
  maxQuantizerAlpha: number;
  tileRowsLog2: number;
  tileColsLog2: number;
  speed: number;
  subsample: number;
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
