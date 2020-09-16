import { EncodeOptions } from 'image-worker/webpEncode';

export interface WebPModule extends EmscriptenWasm.Module {
  encode(
    data: BufferSource,
    width: number,
    height: number,
    options: EncodeOptions,
  ): Uint8Array | null;
}

declare var moduleFactory: EmscriptenWasm.ModuleFactory<WebPModule>;

export default moduleFactory;
