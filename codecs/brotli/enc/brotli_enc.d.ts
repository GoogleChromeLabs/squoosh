export interface BrotliModule extends EmscriptenWasm.Module {
  /**
   * Compress `data` with Brotli at maximum settings and return the size of the
   * result in bytes, or -1 if compression failed.
   */
  compressed_size(data: BufferSource): number;
}

declare var moduleFactory: EmscriptenWasm.ModuleFactory<BrotliModule>;

export default moduleFactory;
