import * as mozJPEG from './mozjpeg/encoder';
import { EncoderState as MozJPEGEncodeData, EncodeOptions as MozJPEGEncodeOptions } from './mozjpeg/encoder';
import * as identity from './identity/encoder';
import { EncoderState as IdentityEncodeData, EncodeOptions as IdentityEncodeOptions } from './identity/encoder';

export type EncoderState = IdentityEncodeData | MozJPEGEncodeData;
export type EncoderOptions = IdentityEncodeOptions | MozJPEGEncodeOptions;
export type EncoderType = keyof typeof encoderMap;

export const encoderMap = {
  [identity.type]: identity,
  [mozJPEG.type]: mozJPEG
};

export const encoders = Array.from(Object.values(encoderMap));
