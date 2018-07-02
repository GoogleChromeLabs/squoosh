import * as mozJPEG from './mozjpeg/encoder';
import * as identity from './identity/encoder';
import * as browserPNG from './browser-png/encoder';
import * as browserJPEG from './browser-jpeg/encoder';
import * as browserWebP from './browser-webp/encoder';
import * as browserGIF from './browser-gif/encoder';
import * as browserTIFF from './browser-tiff/encoder';
import * as browserJP2 from './browser-jp2/encoder';
import * as browserBMP from './browser-bmp/encoder';
import * as browserPDF from './browser-pdf/encoder';

export interface EncoderSupportMap {
  [key: string]: boolean;
}

export type EncoderState =
  identity.EncoderState | mozJPEG.EncoderState | browserPNG.EncoderState |
  browserJPEG.EncoderState | browserWebP.EncoderState | browserGIF.EncoderState |
  browserTIFF.EncoderState | browserJP2.EncoderState | browserBMP.EncoderState |
  browserPDF.EncoderState;
export type EncoderOptions =
  identity.EncodeOptions | mozJPEG.EncodeOptions | browserPNG.EncodeOptions |
  browserJPEG.EncodeOptions | browserWebP.EncodeOptions | browserGIF.EncodeOptions |
  browserTIFF.EncodeOptions | browserJP2.EncodeOptions | browserBMP.EncodeOptions |
  browserPDF.EncodeOptions;
export type EncoderType = keyof typeof encoderMap;

export const encoderMap = {
  [identity.type]: identity,
  [mozJPEG.type]: mozJPEG,
  [browserPNG.type]: browserPNG,
  [browserJPEG.type]: browserJPEG,
  [browserWebP.type]: browserWebP,
  // Safari & Firefox only:
  [browserBMP.type]: browserBMP,
  // Safari only:
  [browserGIF.type]: browserGIF,
  [browserTIFF.type]: browserTIFF,
  [browserJP2.type]: browserJP2,
  [browserPDF.type]: browserPDF,
};

export const encoders = Array.from(Object.values(encoderMap));

/** Does this browser support a given encoder? Indexed by label */
export const encodersSupported = Promise.resolve().then(async () => {
  const encodersSupported: EncoderSupportMap = {};

  await Promise.all(encoders.map(async (encoder) => {
    // If the encoder provides a featureTest, call it, otherwise assume supported.
    const isSupported = !('featureTest' in encoder) || await encoder.featureTest();
    encodersSupported[encoder.type] = isSupported;
  }));

  return encodersSupported;
});
