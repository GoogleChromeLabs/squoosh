import { EncodeOptions, mimeType } from './encoder-meta';
import { canvasEncode } from '../../lib/util';

export function encode(data: ImageData, { quality }: EncodeOptions) {
  return canvasEncode(data, mimeType, quality);
}
