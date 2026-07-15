/**
 * BEN2 source-RGB preservation spike only. Keep PNG decode in the generated
 * feature worker so transparent source RGB avoids browser rasterization.
 */
import { blobToArrayBuffer } from 'features/worker-utils';

let pngModule: Promise<typeof import('codecs/png/pkg')> | undefined;

export default async function pngDecode(blob: Blob): Promise<ImageData> {
  if (!pngModule) {
    pngModule = import('codecs/png/pkg').then(async (module) => {
      await module.default();
      return module;
    });
  }

  const [module, bytes] = await Promise.all([
    pngModule,
    blobToArrayBuffer(blob),
  ]);
  return module.decode(new Uint8Array(bytes));
}
