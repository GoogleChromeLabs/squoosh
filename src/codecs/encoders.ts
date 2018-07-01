import * as mozJPEG from './mozjpeg/encoder';
import * as identity from './identity/encoder';
import * as browserPNG from './browser-png/encoder';

export type EncoderState = identity.EncoderState | mozJPEG.EncoderState | browserPNG.EncoderState;
export type EncoderOptions =
  identity.EncodeOptions | mozJPEG.EncodeOptions | browserPNG.EncodeOptions;
export type EncoderType = keyof typeof encoderMap;

export const encoderMap = {
  [identity.type]: identity,
  [mozJPEG.type]: mozJPEG,
  [browserPNG.type]: browserPNG,
};

export const encoders = Array.from(Object.values(encoderMap));
