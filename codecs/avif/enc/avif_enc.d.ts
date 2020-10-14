import { EncodeOptions } from '../../../src/codecs/avif/encoder-meta';

interface AVIFModule extends EmscriptenWasm.Module {
  encode(data: BufferSource, width: number, height: number, options: EncodeOptions): Uint8Array | null;
}

export default function(opts: EmscriptenWasm.ModuleOpts): Promise<AVIFModule>;
