interface RawImage {
  buffer: Uint8Array;
  width: number;
  height: number;
}

interface AVIFModule extends EmscriptenWasm.Module {
  decode(data: BufferSource): RawImage;
  free_result(): void;
}

export default function(opts: EmscriptenWasm.ModuleOpts): AVIFModule;

