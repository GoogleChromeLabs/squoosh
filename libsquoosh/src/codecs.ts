import { promises as fsp } from 'fs';
import { instantiateEmscriptenWasm, pathify } from './emscripten-utils.js';
import { threads } from 'wasm-feature-detect';
import { cpus } from 'os';

// We use `navigator.hardwareConcurrency` for Emscripten’s pthread pool size.
// This is the only workaround I can get working without crying.
(globalThis as any).navigator = {
  hardwareConcurrency: cpus().length,
};

interface DecodeModule extends EmscriptenWasm.Module {
  decode: (data: Uint8Array) => ImageData;
}

type DecodeModuleFactory = EmscriptenWasm.ModuleFactory<DecodeModule>;

interface RotateModuleInstance {
  exports: {
    memory: WebAssembly.Memory;
    rotate(width: number, height: number, rotate: number): void;
  };
}

interface ResizeWithAspectParams {
  input_width: number;
  input_height: number;
  target_width: number;
  target_height: number;
}

export interface ResizeOptions {
  width: number;
  height: number;
  method: 'triangle' | 'catrom' | 'mitchell' | 'lanczos3';
  premultiply: boolean;
  linearRGB: boolean;
}

export interface QuantOptions {
  numColors: number;
  dither: number;
}

export interface RotateOptions {
  numRotations: number;
}

declare global {
  // Needed for being able to use ImageData as type in codec types
  type ImageData = import('./image_data.js').default;
  // Needed for being able to assign to `globalThis.ImageData`
  var ImageData: ImageData['constructor'];
}

import type { QuantizerModule } from '../../codecs/imagequant/imagequant.js';

// MozJPEG
import type { MozJPEGModule as MozJPEGEncodeModule } from '../../codecs/mozjpeg/enc/mozjpeg_enc';
import mozEnc from '../../codecs/mozjpeg/enc/mozjpeg_node_enc.js';
import mozEncWasm from 'asset-url:../../codecs/mozjpeg/enc/mozjpeg_node_enc.wasm';
import mozDec from '../../codecs/mozjpeg/dec/mozjpeg_node_dec.js';
import mozDecWasm from 'asset-url:../../codecs/mozjpeg/dec/mozjpeg_node_dec.wasm';
import type { EncodeOptions as MozJPEGEncodeOptions } from '../../codecs/mozjpeg/enc/mozjpeg_enc';

// WebP
import type { WebPModule as WebPEncodeModule } from '../../codecs/webp/enc/webp_enc';
import webpEnc from '../../codecs/webp/enc/webp_node_enc.js';
import webpEncWasm from 'asset-url:../../codecs/webp/enc/webp_node_enc.wasm';
import webpDec from '../../codecs/webp/dec/webp_node_dec.js';
import webpDecWasm from 'asset-url:../../codecs/webp/dec/webp_node_dec.wasm';
import type { EncodeOptions as WebPEncodeOptions } from '../../codecs/webp/enc/webp_enc.js';

// AVIF
import type { AVIFModule as AVIFEncodeModule } from '../../codecs/avif/enc/avif_enc';
import avifEnc from '../../codecs/avif/enc/avif_node_enc.js';
import avifEncWasm from 'asset-url:../../codecs/avif/enc/avif_node_enc.wasm';
import avifEncMt from '../../codecs/avif/enc/avif_node_enc_mt.js';
import avifEncMtWorker from 'chunk-url:../../codecs/avif/enc/avif_node_enc_mt.worker.js';
import avifEncMtWasm from 'asset-url:../../codecs/avif/enc/avif_node_enc_mt.wasm';
import avifDec from '../../codecs/avif/dec/avif_node_dec.js';
import avifDecWasm from 'asset-url:../../codecs/avif/dec/avif_node_dec.wasm';
import type { EncodeOptions as AvifEncodeOptions } from '../../codecs/avif/enc/avif_enc.js';

// JXL
import type { JXLModule as JXLEncodeModule } from '../../codecs/jxl/enc/jxl_enc';
import jxlEnc from '../../codecs/jxl/enc/jxl_node_enc.js';
import jxlEncWasm from 'asset-url:../../codecs/jxl/enc/jxl_node_enc.wasm';
import jxlDec from '../../codecs/jxl/dec/jxl_node_dec.js';
import jxlDecWasm from 'asset-url:../../codecs/jxl/dec/jxl_node_dec.wasm';
import type { EncodeOptions as JxlEncodeOptions } from '../../codecs/jxl/enc/jxl_enc.js';

// WP2
import type { WP2Module as WP2EncodeModule } from '../../codecs/wp2/enc/wp2_enc';
import wp2Enc from '../../codecs/wp2/enc/wp2_node_enc.js';
import wp2EncWasm from 'asset-url:../../codecs/wp2/enc/wp2_node_enc.wasm';
import wp2Dec from '../../codecs/wp2/dec/wp2_node_dec.js';
import wp2DecWasm from 'asset-url:../../codecs/wp2/dec/wp2_node_dec.wasm';
import type { EncodeOptions as WP2EncodeOptions } from '../../codecs/wp2/enc/wp2_enc.js';

// PNG
import * as pngEncDec from '../../codecs/png/pkg/squoosh_png.js';
import pngEncDecWasm from 'asset-url:../../codecs/png/pkg/squoosh_png_bg.wasm';
const pngEncDecPromise = () => pngEncDec.default(
  fsp.readFile(pathify(pngEncDecWasm)),
);

// OxiPNG
import * as oxipng from '../../codecs/oxipng/pkg/squoosh_oxipng.js';
import oxipngWasm from 'asset-url:../../codecs/oxipng/pkg/squoosh_oxipng_bg.wasm';
const oxipngPromise = () => oxipng.default(fsp.readFile(pathify(oxipngWasm)));
interface OxiPngEncodeOptions {
  level: number;
}

// Resize
import * as resize from '../../codecs/resize/pkg/squoosh_resize.js';
import resizeWasm from 'asset-url:../../codecs/resize/pkg/squoosh_resize_bg.wasm';
const resizePromise = () => resize.default(fsp.readFile(pathify(resizeWasm)));

// rotate
import rotateWasm from 'asset-url:../../codecs/rotate/rotate.wasm';

// TODO(ergunsh): Type definitions of some modules do not exist
// Figure out creating type definitions for them and remove `allowJs` rule
// We shouldn't need to use Promise<QuantizerModule> below after getting type definitions for imageQuant
// ImageQuant
import imageQuant from '../../codecs/imagequant/imagequant_node.js';
import imageQuantWasm from 'asset-url:../../codecs/imagequant/imagequant_node.wasm';
const imageQuantPromise: Promise<QuantizerModule> = instantiateEmscriptenWasm(
  imageQuant,
  imageQuantWasm,
);

// Our decoders currently rely on a `ImageData` global.
import ImageData from './image_data.js';
globalThis.ImageData = ImageData;

function resizeNameToIndex(name: string) {
  switch (name) {
    case 'triangle':
      return 0;
    case 'catrom':
      return 1;
    case 'mitchell':
      return 2;
    case 'lanczos3':
      return 3;
    default:
      throw Error(`Unknown resize algorithm "${name}"`);
  }
}

function resizeWithAspect({
  input_width,
  input_height,
  target_width,
  target_height,
}: ResizeWithAspectParams): { width: number; height: number } {
  if (!target_width && !target_height) {
    throw Error('Need to specify at least width or height when resizing');
  }

  if (target_width && target_height) {
    return { width: target_width, height: target_height };
  }

  if (!target_width) {
    return {
      width: Math.round((input_width / input_height) * target_height),
      height: target_height,
    };
  }

  return {
    width: target_width,
    height: Math.round((input_height / input_width) * target_width),
  };
}

export const preprocessors = {
  resize: {
    name: 'Resize',
    description: 'Resize the image before compressing',
    instantiate: async () => {
      await resizePromise();
      return (
        buffer: Uint8Array,
        input_width: number,
        input_height: number,
        { width, height, method, premultiply, linearRGB }: ResizeOptions,
      ) => {
        ({ width, height } = resizeWithAspect({
          input_width,
          input_height,
          target_width: width,
          target_height: height,
        }));
        const imageData = new ImageData(
          resize.resize(
            buffer,
            input_width,
            input_height,
            width,
            height,
            resizeNameToIndex(method),
            premultiply,
            linearRGB,
          ),
          width,
          height,
        );
        resize.cleanup();
        return imageData;
      };
    },
    defaultOptions: {
      method: 'lanczos3',
      fitMethod: 'stretch',
      premultiply: true,
      linearRGB: true,
    },
  },
  // // TODO: Need to handle SVGs and HQX
  quant: {
    name: 'ImageQuant',
    description: 'Reduce the number of colors used (aka. paletting)',
    instantiate: async () => {
      const imageQuant = await imageQuantPromise;
      return (
        buffer: Uint8Array,
        width: number,
        height: number,
        { numColors, dither }: QuantOptions,
      ) =>
        new ImageData(
          imageQuant.quantize(buffer, width, height, numColors, dither),
          width,
          height,
        );
    },
    defaultOptions: {
      numColors: 255,
      dither: 1.0,
    },
  },
  rotate: {
    name: 'Rotate',
    description: 'Rotate image',
    instantiate: async () => {
      return async (
        buffer: Uint8Array,
        width: number,
        height: number,
        { numRotations }: RotateOptions,
      ) => {
        const degrees = (numRotations * 90) % 360;
        const sameDimensions = degrees == 0 || degrees == 180;
        const size = width * height * 4;
        const instance = (
          await WebAssembly.instantiate(await fsp.readFile(pathify(rotateWasm)))
        ).instance as RotateModuleInstance;
        const { memory } = instance.exports;
        const additionalPagesNeeded = Math.ceil(
          (size * 2 - memory.buffer.byteLength + 8) / (64 * 1024),
        );
        if (additionalPagesNeeded > 0) {
          memory.grow(additionalPagesNeeded);
        }
        const view = new Uint8ClampedArray(memory.buffer);
        view.set(buffer, 8);
        instance.exports.rotate(width, height, degrees);
        return new ImageData(
          view.slice(size + 8, size * 2 + 8),
          sameDimensions ? width : height,
          sameDimensions ? height : width,
        );
      };
    },
    defaultOptions: {
      numRotations: 0,
    },
  },
} as const;

export const codecs = {
  mozjpeg: {
    name: 'MozJPEG',
    extension: 'jpg',
    detectors: [/^\xFF\xD8\xFF/],
    dec: () =>
      instantiateEmscriptenWasm(mozDec as DecodeModuleFactory, mozDecWasm),
    enc: () =>
      instantiateEmscriptenWasm(
        mozEnc as EmscriptenWasm.ModuleFactory<MozJPEGEncodeModule>,
        mozEncWasm,
      ),
    defaultEncoderOptions: {
      quality: 75,
      baseline: false,
      arithmetic: false,
      progressive: true,
      optimize_coding: true,
      smoothing: 0,
      color_space: 3 /*YCbCr*/,
      quant_table: 3,
      trellis_multipass: false,
      trellis_opt_zero: false,
      trellis_opt_table: false,
      trellis_loops: 1,
      auto_subsample: true,
      chroma_subsample: 2,
      separate_chroma_quality: false,
      chroma_quality: 75,
    },
    autoOptimize: {
      option: 'quality',
      min: 0,
      max: 100,
    },
  },
  webp: {
    name: 'WebP',
    extension: 'webp',
    detectors: [/^RIFF....WEBPVP8[LX ]/s],
    dec: () =>
      instantiateEmscriptenWasm(webpDec as DecodeModuleFactory, webpDecWasm),
    enc: () =>
      instantiateEmscriptenWasm(
        webpEnc as EmscriptenWasm.ModuleFactory<WebPEncodeModule>,
        webpEncWasm,
      ),
    defaultEncoderOptions: {
      quality: 75,
      target_size: 0,
      target_PSNR: 0,
      method: 4,
      sns_strength: 50,
      filter_strength: 60,
      filter_sharpness: 0,
      filter_type: 1,
      partitions: 0,
      segments: 4,
      pass: 1,
      show_compressed: 0,
      preprocessing: 0,
      autofilter: 0,
      partition_limit: 0,
      alpha_compression: 1,
      alpha_filtering: 1,
      alpha_quality: 100,
      lossless: 0,
      exact: 0,
      image_hint: 0,
      emulate_jpeg_size: 0,
      thread_level: 0,
      low_memory: 0,
      near_lossless: 100,
      use_delta_palette: 0,
      use_sharp_yuv: 0,
    },
    autoOptimize: {
      option: 'quality',
      min: 0,
      max: 100,
    },
  },
  avif: {
    name: 'AVIF',
    extension: 'avif',
    detectors: [/^\x00\x00\x00 ftypavif\x00\x00\x00\x00/],
    dec: () =>
      instantiateEmscriptenWasm(avifDec as DecodeModuleFactory, avifDecWasm),
    enc: async () => {
      if (await threads()) {
        return instantiateEmscriptenWasm(
          avifEncMt as EmscriptenWasm.ModuleFactory<AVIFEncodeModule>,
          avifEncMtWasm,
          avifEncMtWorker,
        );
      }
      return instantiateEmscriptenWasm(
        avifEnc as EmscriptenWasm.ModuleFactory<AVIFEncodeModule>,
        avifEncWasm,
      );
    },
    defaultEncoderOptions: {
      cqLevel: 33,
      cqAlphaLevel: -1,
      denoiseLevel: 0,
      tileColsLog2: 0,
      tileRowsLog2: 0,
      speed: 6,
      subsample: 1,
      chromaDeltaQ: false,
      sharpness: 0,
      tune: 0 /* AVIFTune.auto */,
    },
    autoOptimize: {
      option: 'cqLevel',
      min: 62,
      max: 0,
    },
  },
  jxl: {
    name: 'JPEG-XL',
    extension: 'jxl',
    detectors: [/^\xff\x0a/],
    dec: () =>
      instantiateEmscriptenWasm(jxlDec as DecodeModuleFactory, jxlDecWasm),
    enc: () =>
      instantiateEmscriptenWasm(
        jxlEnc as EmscriptenWasm.ModuleFactory<JXLEncodeModule>,
        jxlEncWasm,
      ),
    defaultEncoderOptions: {
      effort: 1,
      quality: 75,
      progressive: false,
      epf: -1,
      lossyPalette: false,
      decodingSpeedTier: 0,
      photonNoiseIso: 0,
    },
    autoOptimize: {
      option: 'quality',
      min: 0,
      max: 100,
    },
  },
  wp2: {
    name: 'WebP2',
    extension: 'wp2',
    detectors: [/^\xF4\xFF\x6F/],
    dec: () =>
      instantiateEmscriptenWasm(wp2Dec as DecodeModuleFactory, wp2DecWasm),
    enc: () =>
      instantiateEmscriptenWasm(
        wp2Enc as EmscriptenWasm.ModuleFactory<WP2EncodeModule>,
        wp2EncWasm,
      ),
    defaultEncoderOptions: {
      quality: 75,
      alpha_quality: 75,
      effort: 5,
      pass: 1,
      sns: 50,
      uv_mode: 0 /*UVMode.UVModeAuto*/,
      csp_type: 0 /*Csp.kYCoCg*/,
      error_diffusion: 0,
      use_random_matrix: false,
    },
    autoOptimize: {
      option: 'quality',
      min: 0,
      max: 100,
    },
  },
  oxipng: {
    name: 'OxiPNG',
    extension: 'png',
    detectors: [/^\x89PNG\x0D\x0A\x1A\x0A/],
    dec: async () => {
      await pngEncDecPromise();
      return {
        decode: (buffer: Uint8Array): ImageData => {
          const imageData = pngEncDec.decode(buffer)
          pngEncDec.cleanup()
          return imageData
        },
      } as any;
    },
    enc: async () => {
      await pngEncDecPromise();
      await oxipngPromise();
      return {
        encode: (
          buffer: Uint8ClampedArray | ArrayBuffer,
          width: number,
          height: number,
          opts: { level: number },
        ) => {
          const simplePng = pngEncDec.encode(
            new Uint8Array(buffer),
            width,
            height,
          );
          const imageData = oxipng.optimise(simplePng, opts.level, false);
          oxipng.cleanup();
          return imageData;
        },
      };
    },
    defaultEncoderOptions: {
      level: 2,
    },
    autoOptimize: {
      option: 'level',
      min: 6,
      max: 1,
    },
  },
} as const;

export {
  MozJPEGEncodeOptions,
  WebPEncodeOptions,
  AvifEncodeOptions,
  JxlEncodeOptions,
  WP2EncodeOptions,
  OxiPngEncodeOptions,
};
