import { EncodeOptions, mimeType } from './encoder-meta';
import { canvasEncode } from '../../lib/util';

export function encode(data: ImageData, options: EncodeOptions) {
  return canvasEncode(data, mimeType);
}
