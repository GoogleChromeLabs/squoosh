import wasmUrl from '../../../codecs/hqx/pkg/squooshhqx_bg.wasm';
import '../../../codecs/hqx/pkg/squooshhqx';
import { HqxOptions } from './processor-meta';

interface WasmBindgenExports {
  resize: typeof import('../../../codecs/hqx/pkg/squooshhqx').resize;
}

type WasmBindgen = ((url: string) => Promise<void>) & WasmBindgenExports;

declare var wasm_bindgen: WasmBindgen;

const ready = wasm_bindgen(wasmUrl);

export async function hqx(
  data: ImageData,
  opts: HqxOptions,
): Promise<ImageData> {
  const input = data;
  await ready;
  const result = wasm_bindgen.resize(
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
