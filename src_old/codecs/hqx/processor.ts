import { resize } from '../../../codecs/hqx/pkg';
import { HqxOptions } from './processor-meta';

export async function hqx(
  data: ImageData,
  opts: HqxOptions,
): Promise<ImageData> {
  const input = data;
  const result = resize(
    new Uint32Array(input.data.buffer),
    input.width,
    input.height,
    opts.factor,
  );
  return new ImageData(
    new Uint8ClampedArray(result.buffer),
    data.width * opts.factor,
    data.height * opts.factor,
  );
}
