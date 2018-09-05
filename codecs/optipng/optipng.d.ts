import {EncodeOptions} from "src/codecs/optipng/encoder";

export interface OptiPngModule extends EmscriptenWasm.Module {
  compress(data: BufferSource, opts: EncodeOptions): Uint8Array;
  free_result(): void;
}

export default function(opts: EmscriptenWasm.ModuleOpts): OptiPngModule;


