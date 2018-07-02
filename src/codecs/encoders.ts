import * as mozJPEG from './mozjpeg/encoder';
import * as identity from './identity/encoder';
import * as browserPNG from './browser-png/encoder';
import * as browserJPEG from './browser-jpeg/encoder';
import * as browserWebP from './browser-webp/encoder';

export interface EncoderSupportMap {
  [key: string]: boolean;
}

export type EncoderState =
  identity.EncoderState | mozJPEG.EncoderState | browserPNG.EncoderState |
  browserJPEG.EncoderState | browserWebP.EncoderState;
export type EncoderOptions =
  identity.EncodeOptions | mozJPEG.EncodeOptions | browserPNG.EncodeOptions |
  browserJPEG.EncodeOptions | browserWebP.EncodeOptions;
export type EncoderType = keyof typeof encoderMap;

export const encoderMap = {
  [identity.type]: identity,
  [mozJPEG.type]: mozJPEG,
  [browserPNG.type]: browserPNG,
  [browserJPEG.type]: browserJPEG,
  [browserWebP.type]: browserWebP,
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
