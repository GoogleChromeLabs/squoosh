import { EncodeOptions } from '../../../src/codecs/avif/encoder-meta';

interface AVIFModule extends EmscriptenWasm.Module {
  encode(data: BufferSource, width: number, height: number, options: EncodeOptions): Uint8Array | null;
  doLeakCheck(): void;
}

export default function(opts: EmscriptenWasm.ModuleOpts): AVIFModule;
