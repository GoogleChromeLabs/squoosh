/**
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import wasmUrl from 'url:codecs/tiff/dec/tiff_dec.wasm';
import { blobToArrayBuffer } from 'features/worker-utils';

interface WasmExports {
  _initialize(): void;
  malloc(size: number): number;
  free(ptr: number): void;
  decode(data: number, size: number): number;
}

let mem: WebAssembly.Memory;
let decodedImage: ImageData | undefined;

const textDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
const decodeString = (ptr: number, len: number) =>
  textDecoder.decode(new Uint8Array(mem.buffer, ptr, len));

const wasmPromise = WebAssembly.instantiateStreaming(fetch(wasmUrl), {
  env: {
    return_decoded_image(data: number, width: number, height: number) {
      const raster = new Uint8ClampedArray(
        mem.buffer,
        data,
        width * height * 4,
      );
      decodedImage = new ImageData(raster, width, height);
      return 1;
    },
    log_warning(ptr: number, len: number) {
      console.warn(decodeString(ptr, len));
    },
    log_error(ptr: number, len: number) {
      console.error(decodeString(ptr, len));
    },
  },
  wasi_snapshot_preview1: {
    proc_exit(code: number) {
      throw new Error(
        'TIFF exited with ' + code + ', probably caused by JPEG decode error',
      );
    },
  },
}).then(({ instance }) => {
  mem = instance.exports.memory as any;
  const module = instance.exports as unknown as WasmExports;
  module._initialize?.();
  return module;
});

export default async function decode(blob: Blob): Promise<ImageData> {
  const [module, data] = await Promise.all([
    wasmPromise,
    blobToArrayBuffer(blob),
  ]);

  const ptr = module.malloc(data.byteLength);
  try {
    new Uint8Array(mem.buffer, ptr).set(new Uint8Array(data));

    const result = module.decode(ptr, data.byteLength);
    if (!result || result <= 0) throw new Error('Decoding error');

    const image = decodedImage;
    decodedImage = undefined;
    if (!image) throw new Error('Decoding error');
    return image;
  } finally {
    module.free(ptr);
  }
}
