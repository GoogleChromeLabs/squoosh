import { instantiateEmscriptenWasm } from "./emscripten-utils.js";

import visdif from "../../codecs/visdif/visdif.js";
import visdifWasm from "asset-url:../../codecs/visdif/visdif.wasm";

// `measure` is a (async) function that takes exactly one numeric parameter and
// returns a value. The function is assumed to be monotonic (an increase in `parameter`
// will result in an increase in the return value. The function uses binary search
// to find `parameter` such that `measure` returns `measureGoal`, within an error
// of `epsilon`. It will use at most `maxRounds` attempts.
export async function binarySearch(
  measureGoal,
  measure,
  { min = 0, max = 100, epsilon = 0.1, maxRounds = 8 } = {}
) {
  let parameter = (max - min) / 2 + min;
  let delta = (max - min) / 4;
  let value;
  let round = 1;
  while (true) {
    value = await measure(parameter);
    if (Math.abs(value - measureGoal) < epsilon || round >= maxRounds) {
      return { parameter, round, value };
    }
    if (value > measureGoal) {
      parameter -= delta;
    } else if (value < measureGoal) {
      parameter += delta;
    }
    delta /= 2;
    round++;
  }
}

export async function autoOptimize(
  bitmapIn,
  encode,
  decode,
  { butteraugliDistanceGoal = 1.4, ...otherOpts } = {}
) {
  const { VisDiff } = await instantiateEmscriptenWasm(visdif, visdifWasm);

  const comparator = new VisDiff(
    bitmapIn.data,
    bitmapIn.width,
    bitmapIn.height
  );

  let bitmapOut;
  let binaryOut;
  // Increasing quality means _decrease_ in Butteraugli distance.
  // `binarySearch` assumes that increasing `parameter` will
  // increase the metric value. So multipliy Butteraugli values by -1.
  const { parameter } = await binarySearch(
    -1 * butteraugliDistanceGoal,
    async quality => {
      binaryOut = await encode(bitmapIn, quality);
      bitmapOut = await decode(binaryOut);
      return -1 * comparator.distance(bitmapOut.data);
    },
    otherOpts
  );
  comparator.delete();

  return {
    bitmap: bitmapOut,
    binary: binaryOut,
    quality: parameter
  };
}
