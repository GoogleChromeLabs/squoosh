export interface EncodeOptions {}

export interface QoiModule extends EmscriptenWasm.Module {
    encode(
        data: BufferSource,
        width: number,
        height: number,
        options: EncodeOptions,
    ): Uint8Array;
}

declare var moduleFactory: EmscriptenWasm.ModuleFactory<QoiModule>;

export default moduleFactory;
