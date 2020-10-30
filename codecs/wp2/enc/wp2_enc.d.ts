import { EncodeOptions } from '../../src/codecs/wp2/encoder-meta';

interface WP2Module extends EmscriptenWasm.Module {
  encode(data: BufferSource, width: number, height: number, options: EncodeOptions): Uint8Array;
  free_result(): void;
}

export default function(opts: EmscriptenWasm.ModuleOpts): Promise<WP2Module>;
