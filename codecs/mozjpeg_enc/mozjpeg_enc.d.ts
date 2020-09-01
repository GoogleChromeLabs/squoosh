import { EncodeOptions } from '../../src/codecs/mozjpeg/encoder-meta';

interface MozJPEGModule extends EmscriptenWasm.Module {
  encode(data: BufferSource, width: number, height: number, options: EncodeOptions): Uint8Array;
}

export default function(opts: EmscriptenWasm.ModuleOpts): Promise<MozJPEGModule>;
