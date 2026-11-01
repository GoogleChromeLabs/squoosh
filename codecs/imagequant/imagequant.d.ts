/// <reference path="../../emscripten-types.d.ts" />

export interface QuantizerModule extends EmscriptenWasm.Module {
  quantize(
    data: BufferSource,
    width: number,
    height: number,
    numColors: number,
    dither: number,
  ): Uint8ClampedArray<ArrayBuffer>;
  zx_quantize(
    data: BufferSource,
    width: number,
    height: number,
    dither: number,
  ): Uint8ClampedArray<ArrayBuffer>;
}

declare var moduleFactory: EmscriptenWasm.ModuleFactory<QuantizerModule>;

export default moduleFactory;
