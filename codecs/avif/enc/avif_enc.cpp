#include <emscripten/bind.h>
#include <emscripten/threading.h>
#include <emscripten/val.h>
#include "avif/avif.h"

using namespace emscripten;

struct AvifOptions {
  // [0 - 63]
  // 0 = lossless
  // 63 = worst quality
  int cqLevel;
  int minQuantizerAlpha;
  // [0 - 6]
  // Creates 2^n tiles in that dimension
  int tileRowsLog2;
  int tileColsLog2;
  // [0 - 10]
  // 0 = slowest
  // 10 = fastest
  int speed;
  // 0 = 4:0:0
  // 1 = 4:2:0
  // 2 = 4:2:2
  // 3 = 4:4:4
  int subsample;
  // Extra chroma compression
  bool chromaDeltaQ;
  // 0-7
  int sharpness;
  // (0: off, 1: variance, 2: complexity, 3: cyclic refresh)
  int aqMode;
};

thread_local const val Uint8Array = val::global("Uint8Array");

val encode(std::string buffer, int width, int height, AvifOptions options) {
  avifRWData output = AVIF_DATA_EMPTY;
  int depth = 8;
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

  bool lossless = options.cqLevel == AVIF_QUANTIZER_LOSSLESS &&
                  options.minQuantizerAlpha == AVIF_QUANTIZER_LOSSLESS &&
                  format == AVIF_PIXEL_FORMAT_YUV444;
  avifImage* image = avifImageCreate(width, height, depth, format);

  if (lossless) {
    image->matrixCoefficients = AVIF_MATRIX_COEFFICIENTS_IDENTITY;
  } else {
    image->matrixCoefficients = AVIF_MATRIX_COEFFICIENTS_BT709;
  }

  uint8_t* rgba = (uint8_t*)buffer.c_str();

  avifRGBImage srcRGB;
  avifRGBImageSetDefaults(&srcRGB, image);
  srcRGB.pixels = rgba;
  srcRGB.rowBytes = width * 4;
  avifImageRGBToYUV(image, &srcRGB);

  avifEncoder* encoder = avifEncoderCreate();

  if (lossless) {
    encoder->minQuantizer = AVIF_QUANTIZER_LOSSLESS;
    encoder->maxQuantizer = AVIF_QUANTIZER_LOSSLESS;
    encoder->minQuantizerAlpha = AVIF_QUANTIZER_LOSSLESS;
    encoder->maxQuantizerAlpha = AVIF_QUANTIZER_LOSSLESS;
  } else {
    encoder->minQuantizer = AVIF_QUANTIZER_BEST_QUALITY;
    encoder->maxQuantizer = AVIF_QUANTIZER_WORST_QUALITY;
    encoder->minQuantizerAlpha = options.minQuantizerAlpha;
    encoder->maxQuantizerAlpha = AVIF_QUANTIZER_WORST_QUALITY;
    avifEncoderSetCodecSpecificOption(encoder, "end-usage", "q");
    avifEncoderSetCodecSpecificOption(encoder, "cq-level", std::to_string(options.cqLevel).c_str());
    avifEncoderSetCodecSpecificOption(encoder, "aq-mode", std::to_string(options.aqMode).c_str());

    avifEncoderSetCodecSpecificOption(encoder, "sharpness",
                                      std::to_string(options.sharpness).c_str());

    if (options.chromaDeltaQ) {
      avifEncoderSetCodecSpecificOption(encoder, "enable-chroma-deltaq", "1");
    }
  }

  encoder->maxThreads = emscripten_num_logical_cores();
  encoder->tileRowsLog2 = options.tileRowsLog2;
  encoder->tileColsLog2 = options.tileColsLog2;
  encoder->speed = options.speed;

  avifResult encodeResult = avifEncoderWrite(encoder, image, &output);
  auto js_result = val::null();
  if (encodeResult == AVIF_RESULT_OK) {
    js_result = Uint8Array.new_(typed_memory_view(output.size, output.data));
  }

  avifImageDestroy(image);
  avifEncoderDestroy(encoder);
  avifRWDataFree(&output);
  return js_result;
}

EMSCRIPTEN_BINDINGS(my_module) {
  value_object<AvifOptions>("AvifOptions")
      .field("cqLevel", &AvifOptions::cqLevel)
      .field("minQuantizerAlpha", &AvifOptions::minQuantizerAlpha)
      .field("tileRowsLog2", &AvifOptions::tileRowsLog2)
      .field("tileColsLog2", &AvifOptions::tileColsLog2)
      .field("speed", &AvifOptions::speed)
      .field("chromaDeltaQ", &AvifOptions::chromaDeltaQ)
      .field("sharpness", &AvifOptions::sharpness)
      .field("aqMode", &AvifOptions::aqMode)
      .field("subsample", &AvifOptions::subsample);

  function("encode", &encode);
}
