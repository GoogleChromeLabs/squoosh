#include <emscripten/bind.h>
#include <emscripten/threading.h>
#include <emscripten/val.h>
#include "avif/avif.h"

#include <memory>
#include <string>

#define RETURN_NULL_IF(expression) \
  do {                             \
    if (expression)                \
      return val::null();          \
  } while (false)

using namespace emscripten;

using AvifImagePtr = std::unique_ptr<avifImage, decltype(&avifImageDestroy)>;
using AvifEncoderPtr = std::unique_ptr<avifEncoder, decltype(&avifEncoderDestroy)>;

struct AvifOptions {
  // [0 - 100]
  // 0 = worst quality
  // 100 = lossless
  int quality;
  // As above, but -1 means 'use quality'
  int qualityAlpha;
  // [0 - 10]
  // 0 = slowest
  // 10 = fastest
  int speed;
  // 0 = 4:0:0
  // 1 = 4:2:0
  // 2 = 4:2:2
  // 3 = 4:4:4
  int subsample;
  // Adaptive quantization, driving libaom's delta-Q mode. (The older aq-mode is
  // superseded by delta-Q for the all-intra path AVIF uses, so it has no effect.)
  // 0 = default: don't set anything, so the mode follows libaom's own default
  //     for the chosen tune (e.g. variance-boost when tune resolves to IQ,
  //     objective otherwise). Matches output with the option not exposed.
  // 1 = off
  // 2 = perceptual
  // 3 = perceptual AI (tuned for all-intra / still images)
  // 4 = variance boost
  int aqMode;
  // Distortion metric the encoder is tuned for. Only applied to the color
  // channels; alpha keeps libaom's default (PSNR).
  // 0 = auto (let libaom pick its default, which is IQ for still images)
  // 1 = PSNR
  // 2 = SSIM
  // 3 = IQ
  int tune;
  // 0-50
  int denoiseLevel;
  // toggles AVIF_CHROMA_DOWNSAMPLING_SHARP_YUV
  bool enableSharpYUV;
  // Bit depth of the encoded image. One of 8, 10 or 12.
  int channelDepth;
  // Premultiply the colour channels by the alpha channel and signal this in the
  // AVIF. The source buffer is always non-premultiplied; libavif premultiplies
  // during the RGB->YUV conversion.
  bool premultiplyAlpha;
};

thread_local const val Uint8Array = val::global("Uint8Array");

val encode(std::string buffer, int width, int height, AvifOptions options) {
  avifResult status;  // To check the return status for avif API's

  int depth = options.channelDepth;
  avifPixelFormat format;
  switch (options.subsample) {
    case 0:
      format = AVIF_PIXEL_FORMAT_YUV400;
      break;
    case 1:
      format = AVIF_PIXEL_FORMAT_YUV420;
      break;
    case 2:
      format = AVIF_PIXEL_FORMAT_YUV422;
      break;
    case 3:
      format = AVIF_PIXEL_FORMAT_YUV444;
      break;
  }

  // Lossless requires YUV444 (so the RGB->YUV step is a reversible repacking)
  // and full-quality color + alpha. qualityAlpha of -1 means "same as quality".
  bool lossless = options.quality == AVIF_QUALITY_LOSSLESS &&
                  (options.qualityAlpha == -1 || options.qualityAlpha == AVIF_QUALITY_LOSSLESS) &&
                  format == AVIF_PIXEL_FORMAT_YUV444;

  // Smart pointer for the input image in YUV format
  AvifImagePtr image(avifImageCreate(width, height, depth, format), avifImageDestroy);
  if (image == nullptr) {
    return val::null();
  }

  if (lossless) {
    // Identity matrix coefficients make the RGB->YUV conversion lossless (no
    // colour space conversion). Range must be full, which avifImageCreate
    // already defaults to.
    image->matrixCoefficients = AVIF_MATRIX_COEFFICIENTS_IDENTITY;
    image->yuvRange = AVIF_RANGE_FULL;
  } else {
    image->matrixCoefficients = AVIF_MATRIX_COEFFICIENTS_BT601;
  }

  // The source RGBA is non-premultiplied (srcRGB.alphaPremultiplied stays
  // false). When this is set, avifImageRGBToYUV premultiplies during conversion
  // and the AVIF is signalled as premultiplied.
  image->alphaPremultiplied = options.premultiplyAlpha;

  uint8_t* rgba = reinterpret_cast<uint8_t*>(const_cast<char*>(buffer.data()));

  avifRGBImage srcRGB;
  avifRGBImageSetDefaults(&srcRGB, image.get());
  // The source buffer is always 8-bit RGBA, regardless of the encoded image's
  // channel depth. avifImageRGBToYUV upconverts to image->depth as needed.
  srcRGB.format = AVIF_RGB_FORMAT_RGBA;
  srcRGB.depth = 8;
  srcRGB.pixels = rgba;
  srcRGB.rowBytes = width * 4;
  if (options.enableSharpYUV) {
    // Higher-quality chroma downsampling. Only has an effect when chroma is
    // actually subsampled (e.g. 4:2:0).
    srcRGB.chromaDownsampling = AVIF_CHROMA_DOWNSAMPLING_SHARP_YUV;
  }

  status = avifImageRGBToYUV(image.get(), &srcRGB);
  if (status != AVIF_RESULT_OK) {
    return val::null();
  }

  // Create a smart pointer for the encoder
  AvifEncoderPtr encoder(avifEncoderCreate(), avifEncoderDestroy);
  if (encoder == nullptr) {
    return val::null();
  }

  encoder->quality = options.quality;
  // qualityAlpha of -1 means "use the same quality as the color channels".
  encoder->qualityAlpha = options.qualityAlpha == -1 ? options.quality : options.qualityAlpha;
  encoder->speed = options.speed;
  encoder->maxThreads = emscripten_num_logical_cores();
  // Let libavif choose a sensible number of tiles based on image dimensions.
  encoder->autoTiling = AVIF_TRUE;

  // Tune the encoder for a distortion metric. The "color:" prefix scopes this
  // to the color channels only, so alpha keeps libaom's default (PSNR). When
  // tune is "auto" we set nothing and let libaom pick its own default.
  const char* tune = nullptr;
  switch (options.tune) {
    case 1:
      tune = "psnr";
      break;
    case 2:
      tune = "ssim";
      break;
    case 3:
      tune = "iq";
      break;
  }
  if (tune != nullptr) {
    status = avifEncoderSetCodecSpecificOption(encoder.get(), "color:tune", tune);
    if (status != AVIF_RESULT_OK) {
      return val::null();
    }
  }

  // Adaptive quantization via libaom's delta-Q mode. Our option value 0 means
  // "leave libaom's default (objective)", so only set it for other values.
  // Map our UI values to libaom DELTAQ_MODE values (see encoder.h):
  //   1 -> 0 (NO_DELTA_Q)        2 -> 2 (perceptual)
  //   3 -> 3 (perceptual AI)     4 -> 6 (variance boost)
  int deltaqMode = -1;
  switch (options.aqMode) {
    case 1:
      deltaqMode = 0;
      break;
    case 2:
      deltaqMode = 2;
      break;
    case 3:
      deltaqMode = 3;
      break;
    case 4:
      deltaqMode = 6;
      break;
  }
  if (deltaqMode != -1) {
    status = avifEncoderSetCodecSpecificOption(encoder.get(), "color:deltaq-mode",
                                               std::to_string(deltaqMode).c_str());
    if (status != AVIF_RESULT_OK) {
      return val::null();
    }
  }

  // Denoise the image as part of encoding. 0 is libaom's default (off), so only
  // set it when requested. Applies to the colour plane only; denoising the
  // monochrome alpha mask is meaningless.
  if (options.denoiseLevel != 0) {
    status = avifEncoderSetCodecSpecificOption(encoder.get(), "color:denoise-noise-level",
                                               std::to_string(options.denoiseLevel).c_str());
    if (status != AVIF_RESULT_OK) {
      return val::null();
    }
  }

  avifRWData output = AVIF_DATA_EMPTY;
  avifResult encodeResult = avifEncoderWrite(encoder.get(), image.get(), &output);

  auto js_result = val::null();
  if (encodeResult == AVIF_RESULT_OK) {
    js_result = Uint8Array.new_(typed_memory_view(output.size, output.data));
  }

  avifRWDataFree(&output);
  return js_result;
}

EMSCRIPTEN_BINDINGS(my_module) {
  value_object<AvifOptions>("AvifOptions")
      .field("quality", &AvifOptions::quality)
      .field("qualityAlpha", &AvifOptions::qualityAlpha)
      .field("speed", &AvifOptions::speed)
      .field("aqMode", &AvifOptions::aqMode)
      .field("tune", &AvifOptions::tune)
      .field("denoiseLevel", &AvifOptions::denoiseLevel)
      .field("subsample", &AvifOptions::subsample)
      .field("enableSharpYUV", &AvifOptions::enableSharpYUV)
      .field("channelDepth", &AvifOptions::channelDepth)
      .field("premultiplyAlpha", &AvifOptions::premultiplyAlpha);

  function("encode", &encode);
}
