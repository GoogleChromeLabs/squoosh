import { EncodeOptions } from '../../src/codecs/mozjpeg/encoder-meta';

interface MozJPEGModule extends EmscriptenWasm.Module {
  encode(data: BufferSource, width: number, height: number, options: EncodeOptions): Uint8Array;
  free_result(): void;
}

export default function(opts: EmscriptenWasm.ModuleOpts): MozJPEGModule;
