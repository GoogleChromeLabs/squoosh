import { optimise } from '../../../codecs/oxipng/pkg';
import { EncodeOptions } from './encoder-meta';

export async function compress(
  data: ArrayBuffer,
  options: EncodeOptions,
): Promise<ArrayBuffer> {
  return optimise(new Uint8Array(data), options.level).buffer;
}
