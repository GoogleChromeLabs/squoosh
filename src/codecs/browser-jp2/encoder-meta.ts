import { canvasEncodeTest } from '../generic/util';

export interface EncodeOptions { }
export interface EncoderState { type: typeof type; options: EncodeOptions; }

export const type = 'browser-jp2';
export const label = 'Browser JPEG 2000';
export const mimeType = 'image/jp2';
export const extension = 'jp2';
export const defaultOptions: EncodeOptions = {};
export const featureTest = () => canvasEncodeTest(mimeType);
