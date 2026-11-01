/// <reference path="../../../emscripten-types.d.ts" />

export interface WebPModule extends EmscriptenWasm.Module {
  decode(data: BufferSource): ImageData | null;
}

declare var moduleFactory: EmscriptenWasm.ModuleFactory<WebPModule>;

export default moduleFactory;
