import { canvasEncode } from 'client/lazy-app/util';
import { mimeType, EncodeOptions } from '../shared/meta';

export function encode(data: ImageData, { quality }: EncodeOptions) {
  return canvasEncode(data, mimeType, quality);
}
