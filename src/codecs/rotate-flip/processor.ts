import { RotateFlipOptions } from './processor-meta';

const bpp = 4;

export function rotateFlip(data: ImageData, opts: RotateFlipOptions): ImageData {
  const flipDimensions = opts.rotate % 180 !== 0;
  const width = flipDimensions ? data.height : data.width;
  const height = flipDimensions ? data.width : data.height;
  const out = new ImageData(width, height);
  const { width: inputWidth, height: inputHeight } = data;
  let i = 0;

  // In the straight-copy case, d1 is x, d2 is y.
  // x starts at 0 and increases.
  // y starts at 0 and increases.
  let d1Start = 0;
  let d1Limit = inputWidth;
  let d1Advance = 1;
  let d1Multiplier = 1;
  let d2Start = 0;
  let d2Limit = inputHeight;
  let d2Advance = 1;
  let d2Multiplier = inputWidth;

  if (opts.rotate === 90) {
    // d1 is y, d2 is x.
    // y starts at its max value and decreases.
    // x starts at 0 and increases.
    d1Start = inputHeight - 1;
    d1Limit = inputHeight;
    d1Advance = -1;
    d1Multiplier = inputWidth;
    d2Start = 0;
    d2Limit = inputWidth;
    d2Advance = 1;
    d2Multiplier = 1;
  } else if (opts.rotate === 180) {
    // d1 is x, d2 is y.
    // x starts at its max and decreases.
    // y starts at its max and decreases.
    d1Start = inputWidth - 1;
    d1Limit = inputWidth;
    d1Advance = -1;
    d1Multiplier = 1;
    d2Start = inputHeight - 1;
    d2Limit = inputHeight;
    d2Advance = -1;
    d2Multiplier = inputWidth;
  } else if (opts.rotate === 270) {
    // d1 is y, d2 is x.
    // y starts at 0 and increases.
    // x starts at its max and decreases.
    d1Start = 0;
    d1Limit = inputHeight;
    d1Advance = 1;
    d1Multiplier = inputWidth;
    d2Start = inputWidth - 1;
    d2Limit = inputWidth;
    d2Advance = -1;
    d2Multiplier = 1;
  }

  if (opts.flipHorizontal) {
    d1Advance *= -1;

    if (d1Start === 0) {
      d1Start = d1Limit - 1;
    } else {
      d1Start = 0;
    }
  }

  if (opts.flipVertical) {
    d2Advance *= -1;

    if (d2Start === 0) {
      d2Start = d2Limit - 1;
    } else {
      d2Start = 0;
    }
  }

  for (let d2 = d2Start; d2 >= 0 && d2 < d2Limit; d2 += d2Advance) {
    for (let d1 = d1Start; d1 >= 0 && d1 < d1Limit; d1 += d1Advance) {
      const start = ((d1 * d1Multiplier) + (d2 * d2Multiplier)) * bpp;
      for (let j = 0; j < 4; j += 1) {
        out.data[i] = data.data[start + j];
        i += 1;
      }
    }
  }

  return out;
}
