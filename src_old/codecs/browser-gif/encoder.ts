import { mimeType } from './encoder-meta';
import { canvasEncode } from '../../lib/util';

export function encode(data: ImageData) {
  return canvasEncode(data, mimeType);
}
