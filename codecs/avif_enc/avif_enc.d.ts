// import { EncodeOptions } from '../../src/codecs/webp/encoder-meta';

interface AVIFModule extends EmscriptenWasm.Module {
  encode(data: BufferSource, width: number, height: number): Uint8Array;
  free_result(): void;
}


export default function(opts: EmscriptenWasm.ModuleOpts): AVIFModule;
