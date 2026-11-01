import type WorkerBridge from '@/worker/bridge';
import { canvasEncode } from '@/lib/canvas';
import * as avif from './encoders/avif/meta';
import * as browserJPEG from './encoders/browserJPEG/meta';
import * as browserPNG from './encoders/browserPNG/meta';
import * as jxl from './encoders/jxl/meta';
import * as mozJPEG from './encoders/mozJPEG/meta';
import * as oxiPNG from './encoders/oxiPNG/meta';
import * as qoi from './encoders/qoi/meta';
import * as webP from './encoders/webP/meta';
import * as wp2 from './encoders/wp2/meta';
import * as resize from './processors/resize/meta';
import * as quantize from './processors/quantize/meta';
import * as rotate from './preprocessors/rotate/meta';

interface EncoderMeta<Options> {
  label: string;
  mimeType: string;
  extension: string;
  defaultOptions: Options;
}

interface Encoder<Options> {
  meta: EncoderMeta<Options>;
  encode(
    signal: AbortSignal,
    workerBridge: WorkerBridge,
    imageData: ImageData,
    options: Options,
  ): Promise<ArrayBuffer | Blob>;
}

function defineEncoder<Options>(
  meta: EncoderMeta<Options>,
  encode: Encoder<Options>['encode'],
): Encoder<Options> {
  return { meta, encode };
}

/**
 * Every encoder, in menu order. The keys are stored in saved side settings,
 * so don't rename them.
 */
export const encoderMap = {
  avif: defineEncoder(avif, (signal, bridge, data, options) =>
    bridge.avifEncode(signal, data, options),
  ),
  browserJPEG: defineEncoder(browserJPEG, (_signal, _bridge, data, options) =>
    canvasEncode(data, browserJPEG.mimeType, options.quality),
  ),
  browserPNG: defineEncoder(browserPNG, (_signal, _bridge, data) =>
    canvasEncode(data, browserPNG.mimeType),
  ),
  jxl: defineEncoder(jxl, (signal, bridge, data, options) =>
    bridge.jxlEncode(signal, data, options),
  ),
  mozJPEG: defineEncoder(mozJPEG, (signal, bridge, data, options) =>
    bridge.mozjpegEncode(signal, data, options),
  ),
  oxiPNG: defineEncoder(oxiPNG, (signal, bridge, data, options) =>
    bridge.oxipngEncode(signal, data, options),
  ),
  qoi: defineEncoder(qoi, (signal, bridge, data, options) =>
    bridge.qoiEncode(signal, data, options),
  ),
  webP: defineEncoder(webP, (signal, bridge, data, options) =>
    bridge.webpEncode(signal, data, options),
  ),
  wp2: defineEncoder(wp2, (signal, bridge, data, options) =>
    bridge.wp2Encode(signal, data, options),
  ),
};

export type EncoderType = keyof typeof encoderMap;

type EncoderOptionsMap = {
  [K in EncoderType]: (typeof encoderMap)[K]['meta']['defaultOptions'];
};

export type EncoderOptions = EncoderOptionsMap[EncoderType];

export type EncoderState = {
  [K in EncoderType]: { type: K; options: EncoderOptionsMap[K] };
}[EncoderType];

export function isEncoderType(type: unknown): type is EncoderType {
  return typeof type === 'string' && Object.hasOwn(encoderMap, type);
}

export function defaultEncoderState(type: EncoderType): EncoderState {
  return {
    type,
    options: structuredClone(encoderMap[type].meta.defaultOptions),
  } as EncoderState;
}

interface Enableable {
  enabled: boolean;
}

export interface ProcessorState {
  resize: Enableable & resize.Options;
  quantize: Enableable & quantize.Options;
}

export function defaultProcessorState(): ProcessorState {
  return structuredClone({
    resize: { enabled: false, ...resize.defaultOptions },
    quantize: { enabled: false, ...quantize.defaultOptions },
  });
}

export interface PreprocessorState {
  rotate: rotate.Options;
}

export function defaultPreprocessorState(): PreprocessorState {
  return structuredClone({ rotate: rotate.defaultOptions });
}
