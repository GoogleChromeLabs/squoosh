import { promises as fsp } from "fs";
import { instantiateEmscriptenWasm, pathify } from "./emscripten-utils.js";

// MozJPEG
import mozEnc from "../../codecs/mozjpeg/enc/mozjpeg_enc.js";
import mozEncWasm from "asset-url:../../codecs/mozjpeg/enc/mozjpeg_enc.wasm";
import mozDec from "../../codecs/mozjpeg/dec/mozjpeg_dec.js";
import mozDecWasm from "asset-url:../../codecs/mozjpeg/dec/mozjpeg_dec.wasm";

// WebP
import webpEnc from "../../codecs/webp/enc/webp_enc.js";
import webpEncWasm from "asset-url:../../codecs/webp/enc/webp_enc.wasm";
import webpDec from "../../codecs/webp/dec/webp_dec.js";
import webpDecWasm from "asset-url:../../codecs/webp/dec/webp_dec.wasm";

// AVIF
import avifEnc from "../../codecs/avif/enc/avif_enc.js";
import avifEncWasm from "asset-url:../../codecs/avif/enc/avif_enc.wasm";
import avifDec from "../../codecs/avif/dec/avif_dec.js";
import avifDecWasm from "asset-url:../../codecs/avif/dec/avif_dec.wasm";

// PNG
import * as pngEncDec from "../../codecs/png/pkg/squoosh_png.js";
import pngEncDecWasm from "asset-url:../../codecs/png/pkg/squoosh_png_bg.wasm";
const pngEncDecPromise = pngEncDec.default(
  fsp.readFile(pathify(pngEncDecWasm))
);

// OxiPNG
import * as oxipng from "../../codecs/oxipng/pkg/squoosh_oxipng.js";
import oxipngWasm from "asset-url:../../codecs/oxipng/pkg/squoosh_oxipng_bg.wasm";
const oxipngPromise = oxipng.default(fsp.readFile(pathify(oxipngWasm)));

// Resize
import * as resize from "../../codecs/resize/pkg/squoosh_resize.js";
import resizeWasm from "asset-url:../../codecs/resize/pkg/squoosh_resize_bg.wasm";
const resizePromise = resize.default(fsp.readFile(pathify(resizeWasm)));

// ImageQuant
import imageQuant from "../../codecs/imagequant/imagequant.js";
import imageQuantWasm from "asset-url:../../codecs/imagequant/imagequant.wasm";
const imageQuantPromise = instantiateEmscriptenWasm(imageQuant, imageQuantWasm);

// Our decoders currently rely on a `ImageData` global.
import ImageData from "./image_data.js";
globalThis.ImageData = ImageData;

function resizeNameToIndex(name) {
  switch (name) {
    case "triangle":
      return 0;
    case "catrom":
      return 1;
    case "mitchell":
      return 2;
    case "lanczos3":
      return 3;
    default:
      throw Error(`Unknown resize algorithm "${name}"`);
  }
}

function resizeWithAspect({
  input_width,
  input_height,
  target_width,
  target_height
}) {
  if (!target_width && !target_height) {
    throw Error("Need to specify at least width or height when resizing");
  }
  if (target_width && target_height) {
    return { width: target_width, height: target_height };
  }
  if (!target_width) {
    return {
      width: Math.round((input_width / input_height) * target_height),
      height: target_height
    };
  }
  if (!target_height) {
    return {
      width: target_width,
      height: Math.round((input_height / input_width) * target_width)
    };
  }
}

export const preprocessors = {
  resize: {
    name: "Resize",
    description: "Resize the image before compressing",
    instantiate: async () => {
      await resizePromise;
      return (
        buffer,
        input_width,
        input_height,
        { width, height, method, premultiply, linearRGB }
      ) => {
        ({ width, height } = resizeWithAspect({
          input_width,
          input_height,
          target_width: width,
          target_height: height
        }));
        return new ImageData(
          resize.resize(
            buffer,
            input_width,
            input_height,
            width,
            height,
            resizeNameToIndex(method),
            premultiply,
            linearRGB
          ),
          width,
          height
        );
      };
    },
    defaultOptions: {
      method: "lanczos3",
      fitMethod: "stretch",
      premultiply: true,
      linearRGB: true
    }
  },
  quant: {
    name: "ImageQuant",
    description: "Reduce the number of colors used (aka. paletting)",
    instantiate: async () => {
      const imageQuant = await imageQuantPromise;
      return (buffer, width, height, { numColors, dither }) =>
        new ImageData(
          imageQuant.quantize(buffer, width, height, numColors, dither),
          width,
          height
        );
    },
    defaultOptions: {
      numColors: 255,
      dither: 1.0
    }
  }
};

export const codecs = {
  mozjpeg: {
    name: "MozJPEG",
    extension: "jpg",
    detectors: [/^\xFF\xD8\xFF/],
    dec: () => instantiateEmscriptenWasm(mozDec, mozDecWasm),
    enc: () => instantiateEmscriptenWasm(mozEnc, mozEncWasm),
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
      chroma_quality: 75
    },
    autoOptimize: {
      option: "quality",
      min: 0,
      max: 100
    }
  },
  webp: {
    name: "WebP",
    extension: "webp",
    detectors: [/^RIFF....WEBPVP8[LX ]/],
    dec: () => instantiateEmscriptenWasm(webpDec, webpDecWasm),
    enc: () => instantiateEmscriptenWasm(webpEnc, webpEncWasm),
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
      use_sharp_yuv: 0
    },
    autoOptimize: {
      option: "quality",
      min: 0,
      max: 100
    }
  },
  avif: {
    name: "AVIF",
    extension: "avif",
    detectors: [/^\x00\x00\x00 ftypavif\x00\x00\x00\x00/],
    dec: () => instantiateEmscriptenWasm(avifDec, avifDecWasm),
    enc: () => instantiateEmscriptenWasm(avifEnc, avifEncWasm),
    defaultEncoderOptions: {
      minQuantizer: 16,
      maxQuantizer: 16,
      tileColsLog2: 0,
      tileRowsLog2: 0,
      speed: 10,
      subsample: 0
    },
    autoOptimize: {
      option: "maxQuantizer",
      min: 0,
      max: 62
    }
  },
  oxipng: {
    name: "OxiPNG",
    extension: "png",
    detectors: [/^\x89PNG\x0D\x0A\x1A\x0A/],
    dec: async () => {
      await pngEncDecPromise;
      return { decode: pngEncDec.decode };
    },
    enc: async () => {
      await pngEncDecPromise;
      await oxipngPromise;
      return {
        encode: (buffer, width, height, opts) => {
          const simplePng = new Uint8Array(
            pngEncDec.encode(new Uint8Array(buffer), width, height)
          );
          return new Uint8Array(oxipng.optimise(simplePng, opts.level));
        }
      };
    },
    defaultEncoderOptions: {
      level: 2
    },
    autoOptimize: {
      option: "level",
      min: 6,
      max: 1
    }
  }
};
