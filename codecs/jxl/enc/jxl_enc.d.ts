import { EncodeOptions } from '../../../src/codecs/jxl/encoder-meta';

interface JXLModule extends EmscriptenWasm.Module {
  encode(
    data: BufferSource,
    width: number,
    height: number,
    options: EncodeOptions,
  ): Uint8Array | null;
}

export default function (opts: EmscriptenWasm.ModuleOpts): Promise<JXLModule>;
