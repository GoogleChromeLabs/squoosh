import type { Ssimulacra2Module } from 'codecs/ssimulacra2/ssimulacra2';
import { initEmscriptenModule } from 'features/worker-utils';

let emscriptenModule: Promise<Ssimulacra2Module>;

/**
 * Compute the SSIMULACRA 2 score comparing `distorted` against `original`.
 * Both are ImageData of identical dimensions. Higher is better (~100 = perfect);
 * returns -1 for images smaller than 8x8.
 */
export default async function ssimulacra2(
  original: ImageData,
  distorted: ImageData,
): Promise<number> {
  if (!emscriptenModule) {
    const module = await import('codecs/ssimulacra2/ssimulacra2');
    emscriptenModule = initEmscriptenModule(module.default);
  }

  const module = await emscriptenModule;
  const comparator = new module.Ssimulacra2(
    original.data,
    original.width,
    original.height,
  );
  try {
    return comparator.compare(distorted.data);
  } finally {
    comparator.delete();
  }
}
