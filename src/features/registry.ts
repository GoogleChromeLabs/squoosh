import type WorkerBridge from '@/worker/bridge';
import { canvasCanEncode, canvasEncode } from '@/lib/canvas';
import * as avif from './encoders/avif/meta';
import * as browserAVIF from './encoders/browserAVIF/meta';
import * as browserJPEG from './encoders/browserJPEG/meta';
import * as browserPNG from './encoders/browserPNG/meta';
import * as browserWebP from './encoders/browserWebP/meta';
import * as jxl from './encoders/jxl/meta';
import * as mozJPEG from './encoders/mozJPEG/meta';
import * as oxiPNG from './encoders/oxiPNG/meta';
import * as qoi from './encoders/qoi/meta';
import * as webP from './encoders/webP/meta';
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
  /** Whether this browser can use the encoder. Missing means always. */
  isSupported?(): boolean;
}

function defineEncoder<Options>(
  meta: EncoderMeta<Options>,
  encode: Encoder<Options>['encode'],
): Encoder<Options> {
  return { meta, encode };
}

/** An encoder built into the browser, offered only where it works. */
function defineBrowserEncoder<Options extends { quality?: number }>(
  meta: EncoderMeta<Options>,
): Encoder<Options> {
  return {
    meta,
    encode: (_signal, _bridge, data, options) =>
      canvasEncode(data, meta.mimeType, options.quality),
    isSupported: () => canvasCanEncode(meta.mimeType),
  };
}

/**
 * Every encoder, in menu order. The keys are stored in saved side settings,
 * so don't rename them.
 */
export const encoderMap = {
  avif: defineEncoder(avif, (signal, bridge, data, options) =>
    bridge.avifEncode(signal, data, options),
  ),
  browserAVIF: defineBrowserEncoder(browserAVIF),
  browserJPEG: defineBrowserEncoder(browserJPEG),
  browserPNG: defineBrowserEncoder(browserPNG),
  browserWebP: defineBrowserEncoder(browserWebP),
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
};

export type EncoderType = keyof typeof encoderMap;

/** Whether this browser can use an encoder (some browser ones it can't). */
export function isEncoderSupported(type: EncoderType): boolean {
  const { isSupported } = encoderMap[type] as Pick<
    Encoder<unknown>,
    'isSupported'
  >;
  return isSupported?.() ?? true;
}

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
