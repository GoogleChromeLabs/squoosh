// import { EncodeOptions } from '../../src/codecs/webp/encoder-meta';

interface WebPModule extends EmscriptenWasm.Module {
  encode(data: BufferSource, width: number, height: number): Uint8Array;
  free_result(): void;
}


export default function(opts: EmscriptenWasm.ModuleOpts): WebPModule;
