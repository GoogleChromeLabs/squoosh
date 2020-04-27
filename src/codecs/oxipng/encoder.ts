// @ts-ignore
import optimiser from '../../../codecs/oxipng/spawn.js';
import { EncodeOptions } from './encoder-meta';

export async function compress(data: ArrayBuffer, options: EncodeOptions): Promise<ArrayBuffer> {
  return (await optimiser).optimise(new Uint8Array(data), options.level).buffer;
}
