import * as identity from './identity/encoder-meta';
import * as optiPNG from './optipng/encoder-meta';
import * as mozJPEG from './mozjpeg/encoder-meta';
import * as webP from './webp/encoder-meta';
import * as browserPNG from './browser-png/encoder-meta';
import * as browserJPEG from './browser-jpeg/encoder-meta';
import * as browserWebP from './browser-webp/encoder-meta';
import * as browserGIF from './browser-gif/encoder-meta';
import * as browserTIFF from './browser-tiff/encoder-meta';
import * as browserJP2 from './browser-jp2/encoder-meta';
import * as browserBMP from './browser-bmp/encoder-meta';
import * as browserPDF from './browser-pdf/encoder-meta';

export interface EncoderSupportMap {
  [key: string]: boolean;
}

export type EncoderState =
  identity.EncoderState |
  optiPNG.EncoderState |
  mozJPEG.EncoderState |
  webP.EncoderState |
  browserPNG.EncoderState |
  browserJPEG.EncoderState |
  browserWebP.EncoderState |
  browserGIF.EncoderState |
  browserTIFF.EncoderState |
  browserJP2.EncoderState |
  browserBMP.EncoderState |
  browserPDF.EncoderState;

export type EncoderOptions =
  identity.EncodeOptions |
  optiPNG.EncodeOptions |
  mozJPEG.EncodeOptions |
  webP.EncodeOptions |
  browserPNG.EncodeOptions |
  browserJPEG.EncodeOptions |
  browserWebP.EncodeOptions |
  browserGIF.EncodeOptions |
  browserTIFF.EncodeOptions |
  browserJP2.EncodeOptions |
  browserBMP.EncodeOptions |
  browserPDF.EncodeOptions;

export type EncoderType = keyof typeof encoderMap;

export const encoderMap = {
  [identity.type]: identity,
  [optiPNG.type]: optiPNG,
  [mozJPEG.type]: mozJPEG,
  [webP.type]: webP,
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
