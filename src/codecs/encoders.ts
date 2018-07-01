import * as mozJPEG from './mozjpeg/encoder';
import * as identity from './identity/encoder';

export type EncoderState = identity.EncoderState | mozJPEG.EncoderState;
export type EncoderOptions = identity.EncodeOptions | mozJPEG.EncodeOptions;
export type EncoderType = keyof typeof encoderMap;

export const encoderMap = {
  [identity.type]: identity,
  [mozJPEG.type]: mozJPEG,
};

export const encoders = Array.from(Object.values(encoderMap));
