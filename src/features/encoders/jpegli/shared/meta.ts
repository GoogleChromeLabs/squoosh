import {
  EncodeOptions,
  JpegliChromaSubsample,
} from 'codecs/jpegli/enc/jpegli_enc';
export { EncodeOptions, JpegliChromaSubsample };

export const label = 'JPEGLI';
export const mimeType = 'image/jpeg';
export const extension = 'jpg';
export const defaultOptions: EncodeOptions = {
  quality: 75,
  progressiveLevel: 2,
  chromaSubsampling: JpegliChromaSubsample.YCbCr420,
};
