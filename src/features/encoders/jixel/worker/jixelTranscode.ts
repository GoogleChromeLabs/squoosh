import type { EncodeOptions } from '../shared/meta';
import { withEncoder } from '../shared/encoderModule';

/**
 * Losslessly recompress a JPEG as JPEG XL.
 *
 * `data` is the original JPEG file, not pixels. Effort only changes the
 * entropy coding, so the image is the same at every effort.
 */
export default function transcode(
  data: ArrayBuffer,
  options: EncodeOptions,
): Promise<ArrayBuffer> {
  return withEncoder((module) =>
    module.transcode(data, {
      speed: options.effort - 1,
      jpegReconstruction: options.storeJpegMetadata,
    }),
  );
}
