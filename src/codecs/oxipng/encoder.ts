import * as oxipng from '../../../codecs/oxipng/pkg/oxipng_manual';
import { EncodeOptions } from './encoder-meta';

export async function compress(data: BufferSource, { level }: EncodeOptions): Promise<ArrayBuffer> {
  let buffer: ArrayBuffer;

  if (ArrayBuffer.isView(data)) {
    buffer = data.buffer;
  } else {
    buffer = data;
  }
  debugger;
  const resultView = await oxipng.compress(new Uint8Array(buffer), level);
  const result = new Uint8Array(resultView);

  // wasm can’t run on SharedArrayBuffers, so we hard-cast to ArrayBuffer.
  return result.buffer as ArrayBuffer;
}
