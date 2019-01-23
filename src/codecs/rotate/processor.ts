import wasmUrl from '../../../codecs/rotate/rotate.wasm';
import { RotateOptions, RotateModuleInstance } from './processor-meta';

export async function rotate(
  data: ImageData,
  opts: RotateOptions,
): Promise<ImageData> {
  const flipDimensions = opts.rotate % 180 !== 0;
  // Number of wasm memory pages (á 64KiB) needed to store the image twice.
  const bytesPerImage = data.width * data.height * 4;
  const numPagesNeeded = Math.ceil(bytesPerImage * 2 / (64 * 1024));
  const { instance } = (await (WebAssembly as any).instantiateStreaming(
    fetch(wasmUrl),
  )) as { instance: RotateModuleInstance };

  instance.exports.memory.grow(numPagesNeeded);
  const view = new Uint8ClampedArray(instance.exports.memory.buffer);
  view.set(data.data);

  instance.exports.rotate(data.width, data.height, opts.rotate);
  return new ImageData(
    view.slice(bytesPerImage, bytesPerImage * 2),
    flipDimensions ? data.height : data.width,
    flipDimensions ? data.width : data.height,
  );
}
