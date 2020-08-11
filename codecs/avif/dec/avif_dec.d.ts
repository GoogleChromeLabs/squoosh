interface AVIFModule extends EmscriptenWasm.Module {
  decode(data: BufferSource): ImageData | null;
  doLeakCheck(): void;
}

export default function(opts: EmscriptenWasm.ModuleOpts): AVIFModule;

