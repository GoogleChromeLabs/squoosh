import { blobToArrayBuffer } from '../../lib/util';
import { DecoderWorker } from '../codec-worker';

export const name = 'WASM WebP Decoder';

const POOL_SIZE = 4;
const pool: Decoder[] = [];
const queue: ((decoder: Decoder) => void)[] = [];

export async function decode(blob: Blob): Promise<ImageData> {
  let decoder = pool.filter(worker => !worker.busy)[0];

  if (!decoder) {
    // no decoders are free
    if (pool.length < POOL_SIZE) {
      // ...but we're allowed to allocate a new one:
      pool.push(decoder = await new Decoder());
    } else {
      // ...so enter into the queue to wait for the next free decoder:
      decoder = (await new Promise((resolve) => {
        queue.unshift(resolve);
      })) as Decoder;
    }
  }

  try {
    return decoder.decode(await blobToArrayBuffer(blob));
  } finally {
    // the decoder is now free, pass it to any next pending decode in the queue:
    const next = queue.pop();
    if (next) next(decoder);
  }
}

export class Decoder extends DecoderWorker<ArrayBuffer, void> {
  protected load(): Worker {
    // TS definitions for Worker incorrectly omit the initialization options dictionary argument.
    // @ts-ignore
    return new Worker('./Decoder.worker', { type: 'module' });
  }
}

export async function isSupported(): Promise<boolean> {
  return true;
}

const supportedMimeTypes = ['image/webp'];
export function canHandleMimeType(mimeType: string): boolean {
  return supportedMimeTypes.includes(mimeType);
}
