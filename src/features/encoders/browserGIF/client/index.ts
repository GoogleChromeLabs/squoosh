import { canvasEncodeTest, canvasEncode } from 'client/lazy-app/util';
import { mimeType } from '../shared/meta';

export const featureTest = () => canvasEncodeTest(mimeType);
export const encode = (data: ImageData) => canvasEncode(data, mimeType);
