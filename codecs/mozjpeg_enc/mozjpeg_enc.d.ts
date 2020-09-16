import { EncodeOptions } from 'image-worker/mozjpegEncode';

export interface MozJPEGModule extends EmscriptenWasm.Module {
  encode(
    data: BufferSource,
    width: number,
    height: number,
    options: EncodeOptions,
  ): Uint8Array;
}

declare var moduleFactory: EmscriptenWasm.ModuleFactory<MozJPEGModule>;

export default moduleFactory;
