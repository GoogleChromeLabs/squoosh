interface QuantizerModule extends EmscriptenWasm.Module {
  quantize(data: BufferSource, width: number, height: number, numColors: number, dither: number): Uint8ClampedArray;
  zx_quantize(data: BufferSource, width: number, height: number, dither: number): Uint8ClampedArray;
}

export default function(opts: EmscriptenWasm.ModuleOpts): QuantizerModule;
