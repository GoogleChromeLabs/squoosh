interface RawImage {
  buffer: Uint8Array;
  width: number;
  height: number;
}

interface QuantizerModule extends EmscriptenWasm.Module {
  quantize(data: BufferSource, width: number, height: number, numColors: number, dither: number): RawImage;
  zx_quantize(data: BufferSource, width: number, height: number, dither: number): RawImage;
  free_result(): void;
}

export default function(opts: EmscriptenWasm.ModuleOpts): QuantizerModule;


