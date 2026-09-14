import type { Ssimulacra2Module } from 'codecs/ssimulacra2/ssimulacra2';
import { initEmscriptenModule } from 'features/worker-utils';

let emscriptenModule: Promise<Ssimulacra2Module> | undefined;

/** The metric needs at least 8x8 to run its first scale. */
const MIN_SIDE = 8;

/**
 * Compute the SSIMULACRA 2 score comparing `distorted` against `original`.
 * Both are ImageData of identical dimensions. Higher is better (~100 = perfect).
 *
 * Throws if the images differ in size (the metric needs a pixel-for-pixel
 * pairing; mismatched buffers would otherwise be read out of bounds), if either
 * side is under `MIN_SIDE`, or if the comparison runs out of memory.
 *
 * These are errors rather than sentinel return values because the metric's real
 * scores run to -inf, so no in-band number could be told apart from a genuine
 * result.
 */
export default async function ssimulacra2(
  original: ImageData,
  distorted: ImageData,
): Promise<number> {
  if (
    original.width !== distorted.width ||
    original.height !== distorted.height
  ) {
    throw new Error(
      `SSIMULACRA 2 needs images of equal size, got ` +
        `${original.width}x${original.height} and ` +
        `${distorted.width}x${distorted.height}`,
    );
  }

  if (original.width < MIN_SIDE || original.height < MIN_SIDE) {
    throw new Error(
      `Image too small for SSIMULACRA 2: ` +
        `${original.width}x${original.height}, the minimum is ` +
        `${MIN_SIDE}x${MIN_SIDE}`,
    );
  }

  if (!emscriptenModule) {
    const module = await import('codecs/ssimulacra2/ssimulacra2');
    emscriptenModule = initEmscriptenModule(module.default);
  }

  const module = await emscriptenModule;
  let comparator: InstanceType<Ssimulacra2Module['Ssimulacra2']> | undefined;

  try {
    comparator = new module.Ssimulacra2(
      original.data,
      original.width,
      original.height,
    );
    return comparator.compare(distorted.data);
  } catch (err) {
    // The metric keeps ~10 full-resolution float buffers live at once, so a
    // large pair can exhaust whatever the host is willing to hand out. libjxl
    // responds to a failed allocation by aborting the entire wasm module, which
    // surfaces here as an opaque trap and leaves this instance permanently
    // unusable - so drop it, and let the next call build a fresh one.
    emscriptenModule = undefined;
    comparator = undefined; // deleting a torn-down instance would throw again

    // The trap itself reads as a bare "unreachable", so keep it alongside the
    // explanation rather than replacing it. (Error's `cause` option would be
    // the natural home, but it isn't typed until TypeScript 4.6.)
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(
      `SSIMULACRA 2 failed on ${original.width}x${original.height}. The image ` +
        `may be too large to compare on this device: the metric needs a lot of ` +
        `memory, and how much is available varies by browser and machine. ` +
        `(${detail})`,
    );
  } finally {
    comparator?.delete();
  }
}
