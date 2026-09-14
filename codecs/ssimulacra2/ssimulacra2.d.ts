/** An Embind-bound SSIMULACRA 2 comparator, scoped to one reference image. */
export interface Ssimulacra2 {
  /**
   * Score `distorted` against the reference image. `distorted` is interleaved
   * 8-bit RGBA of the same dimensions as the reference. Returns a number
   * (higher is better, ~100 = perfect), or `NaN` if the image is smaller than
   * the 8x8 minimum.
   *
   * `NaN` rather than a negative sentinel because real scores run to -inf.
   *
   * If the comparison runs out of memory, libjxl aborts the wasm module: this
   * throws, and the module is dead for every later call. Build a new one.
   */
  compare(distorted: BufferSource): number;
  /** Frees the wasm-side instance. Call when finished. */
  delete(): void;
}

export interface Ssimulacra2Constructor {
  /** `original` is interleaved 8-bit RGBA of `width * height * 4` bytes. */
  new (original: BufferSource, width: number, height: number): Ssimulacra2;
}

export interface Ssimulacra2Module extends EmscriptenWasm.Module {
  Ssimulacra2: Ssimulacra2Constructor;
}

declare var moduleFactory: EmscriptenWasm.ModuleFactory<Ssimulacra2Module>;

export default moduleFactory;
