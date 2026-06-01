/** An Embind-bound SSIMULACRA 2 comparator, scoped to one reference image. */
export interface Ssimulacra2 {
  /**
   * Score `distorted` against the reference image. `distorted` is interleaved
   * 8-bit RGBA of the same dimensions as the reference. Returns a number
   * (higher is better, ~100 = perfect), or -1 if the image is smaller than 8x8.
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
