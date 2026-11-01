/// <reference path="../../../emscripten-types.d.ts" />

export interface QOIModule extends EmscriptenWasm.Module {
  decode(data: BufferSource): ImageData | null;
}

declare var moduleFactory: EmscriptenWasm.ModuleFactory<QOIModule>;

export default moduleFactory;
