// @ts-ignore
import init from '../../../codecs/oxipng/spawn';
import { EncodeOptions } from './encoder-meta';

export async function compress(data: ArrayBuffer, options: EncodeOptions): Promise<ArrayBuffer> {
  for (let i = 0; i < 100; i += 1) {
    const optimiser = await init();
    console.log(`Run #${i}: ${optimiser.optimise(new Uint8Array(data), options.level).buffer.byteLength} bytes`);
    optimiser.freeWorkers();
  }
  return (await init()).optimise(new Uint8Array(data), options.level).buffer;
}
