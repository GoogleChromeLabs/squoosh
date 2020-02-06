// import { EncodeOptions } from '../../src/codecs/avif/encoder-meta';

interface JXLModule extends EmscriptenWasm.Module {
  encode(data: BufferSource, width: number, height: number): Uint8Array;
  free_result(): void;
}


export default function(opts: EmscriptenWasm.ModuleOpts): JXLModule;
