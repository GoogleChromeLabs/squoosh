/**
 * BEN2 reference pre/post helpers. Disposable parity spike only.
 *
 * Matches the measured Transformers.js/Sharp affine contract: asymmetric
 * coordinates, zero-valued out-of-range neighbours, then rounded u8 output.
 */

const IMAGENET_MEAN = [0.485, 0.456, 0.406];
const IMAGENET_STD = [0.229, 0.224, 0.225];

function positiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive integer`);
  }
}

export function resizeU8AsymmetricZero(
  source: Uint8Array | Uint8ClampedArray,
  sourceWidth: number,
  sourceHeight: number,
  destinationWidth: number,
  destinationHeight: number,
  channels: number,
): Uint8ClampedArray {
  positiveInteger(sourceWidth, 'sourceWidth');
  positiveInteger(sourceHeight, 'sourceHeight');
  positiveInteger(destinationWidth, 'destinationWidth');
  positiveInteger(destinationHeight, 'destinationHeight');
  positiveInteger(channels, 'channels');
  if (source.length !== sourceWidth * sourceHeight * channels) {
    throw new RangeError('source length does not match its dimensions');
  }

  const output = new Uint8ClampedArray(
    destinationWidth * destinationHeight * channels,
  );
  for (let destinationY = 0; destinationY < destinationHeight; destinationY++) {
    const sourceY = (destinationY * sourceHeight) / destinationHeight;
    const y0 = Math.floor(sourceY);
    const y1 = y0 + 1;
    const yFraction = sourceY - y0;
    const y0Offset = y0 * sourceWidth;
    const y1InBounds = y1 < sourceHeight;

    for (
      let destinationX = 0;
      destinationX < destinationWidth;
      destinationX++
    ) {
      const sourceX = (destinationX * sourceWidth) / destinationWidth;
      const x0 = Math.floor(sourceX);
      const x1 = x0 + 1;
      const xFraction = sourceX - x0;
      const x1InBounds = x1 < sourceWidth;
      const destinationOffset =
        (destinationY * destinationWidth + destinationX) * channels;

      for (let channel = 0; channel < channels; channel++) {
        const topLeft = source[(y0Offset + x0) * channels + channel];
        const topRight = x1InBounds
          ? source[(y0Offset + x1) * channels + channel]
          : 0;
        const bottomLeft = y1InBounds
          ? source[(y1 * sourceWidth + x0) * channels + channel]
          : 0;
        const bottomRight =
          x1InBounds && y1InBounds
            ? source[(y1 * sourceWidth + x1) * channels + channel]
            : 0;
        const top = topLeft + (topRight - topLeft) * xFraction;
        const bottom = bottomLeft + (bottomRight - bottomLeft) * xFraction;
        output[destinationOffset + channel] = Math.round(
          top + (bottom - top) * yFraction,
        );
      }
    }
  }
  return output;
}

export function makeNormalizedInput(
  sourceRgba: Uint8Array | Uint8ClampedArray,
  sourceWidth: number,
  sourceHeight: number,
  inputSize: number,
): Float32Array {
  const resized = resizeU8AsymmetricZero(
    sourceRgba,
    sourceWidth,
    sourceHeight,
    inputSize,
    inputSize,
    4,
  );
  const planeSize = inputSize * inputSize;
  const input = new Float32Array(planeSize * 3);
  for (let pixel = 0; pixel < planeSize; pixel++) {
    for (let channel = 0; channel < 3; channel++) {
      input[channel * planeSize + pixel] =
        (resized[pixel * 4 + channel] / 255 - IMAGENET_MEAN[channel]) /
        IMAGENET_STD[channel];
    }
  }
  return input;
}

export function makeResizedMatte(
  raw: Float32Array,
  sourceWidth: number,
  sourceHeight: number,
  inputSize: number,
): Uint8ClampedArray {
  if (raw.length !== inputSize * inputSize) {
    throw new RangeError('raw matte length does not match inputSize');
  }

  let min = Infinity;
  let max = -Infinity;
  for (const value of raw) {
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  const needsSigmoid = min < -1e-5 || max > 1.00001;
  const matte = new Uint8Array(raw.length);
  for (let pixel = 0; pixel < raw.length; pixel++) {
    const probability = needsSigmoid
      ? 1 / (1 + Math.exp(-raw[pixel]))
      : raw[pixel];
    matte[pixel] = Math.trunc(Math.min(255, Math.max(0, probability * 255)));
  }
  return resizeU8AsymmetricZero(
    matte,
    inputSize,
    inputSize,
    sourceWidth,
    sourceHeight,
    1,
  );
}
