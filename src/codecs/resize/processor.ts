import wasmUrl from '../../../codecs/resize/pkg/resize_bg.wasm';
import '../../../codecs/resize/pkg/resize';
import { WorkerResizeOptions } from './processor-meta';
// import { getContainOffsets } from './util';

declare var wasm_bindgen: { resize: typeof import('../../../codecs/resize/pkg/resize').resize };

export async function resize(data: ImageData, opts: WorkerResizeOptions): Promise<ImageData> {
  // let sx = 0;
  // let sy = 0;
  const sw = opts.width;
  const sh = opts.height;

  if (opts.fitMethod === 'contain') {
    throw Error('Not implemented');
    // ({ sx, sy, sw, sh } = getContainOffsets(sw, sh, opts.width, opts.height));
  }

  // @ts-ignore
  await wasm_bindgen(wasmUrl);

  const result = wasm_bindgen.resize(
    new Uint8Array(data.data.buffer), data.width, data.height, sw, sh, 4,
  );
  return new ImageData(new Uint8ClampedArray(result.buffer), sw, sh);
}
