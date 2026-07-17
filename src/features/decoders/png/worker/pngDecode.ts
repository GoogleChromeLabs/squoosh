/** Decode PNG bytes directly so transparent pixels retain straight RGB. */
import { blobToArrayBuffer } from 'features/worker-utils';

let pngModule: Promise<typeof import('codecs/png/pkg')> | undefined;

function pngModuleLoadError(): Error {
  const error = new Error('PNG decoder assets failed to load');
  error.name = 'PngModuleLoadError';
  return error;
}

export default async function pngDecode(blob: Blob): Promise<ImageData> {
  if (!pngModule) {
    const loading = import('codecs/png/pkg').then(async (module) => {
      await module.default();
      return module;
    });
    const cached = loading.catch(() => {
      if (pngModule === cached) pngModule = undefined;
      throw pngModuleLoadError();
    });
    pngModule = cached;
  }

  const [module, bytes] = await Promise.all([
    pngModule,
    blobToArrayBuffer(blob),
  ]);
  return module.decode(new Uint8Array(bytes));
}
