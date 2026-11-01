/// <reference path="../../../emscripten-types.d.ts" />

export interface WP2Module extends EmscriptenWasm.Module {
  decode(data: BufferSource): ImageData | null;
}

declare var moduleFactory: EmscriptenWasm.ModuleFactory<WP2Module>;

export default moduleFactory;
