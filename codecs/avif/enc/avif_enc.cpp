#include <emscripten/bind.h>
#include <emscripten/threading.h>
#include <emscripten/val.h>
#include "avif/avif.h"

using namespace emscripten;

struct AvifOptions {
  // [0 - 63]
  // 0 = lossless
  // 63 = worst quality
  int minQuantizer;
  int maxQuantizer;
  int minQuantizerAlpha;
  int maxQuantizerAlpha;
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

  avifImage* image = avifImageCreate(width, height, depth, format);

  if (options.maxQuantizer == AVIF_QUANTIZER_LOSSLESS &&
      options.minQuantizer == AVIF_QUANTIZER_LOSSLESS &&
      options.minQuantizerAlpha == AVIF_QUANTIZER_LOSSLESS &&
      options.maxQuantizerAlpha == AVIF_QUANTIZER_LOSSLESS && format == AVIF_PIXEL_FORMAT_YUV444) {
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
  encoder->maxThreads = emscripten_num_logical_cores();
  encoder->minQuantizer = options.minQuantizer;
  encoder->maxQuantizer = options.maxQuantizer;
  encoder->minQuantizerAlpha = options.minQuantizerAlpha;
  encoder->maxQuantizerAlpha = options.maxQuantizerAlpha;
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
      .field("minQuantizer", &AvifOptions::minQuantizer)
      .field("maxQuantizer", &AvifOptions::maxQuantizer)
      .field("minQuantizerAlpha", &AvifOptions::minQuantizerAlpha)
      .field("maxQuantizerAlpha", &AvifOptions::maxQuantizerAlpha)
      .field("tileRowsLog2", &AvifOptions::tileRowsLog2)
      .field("tileColsLog2", &AvifOptions::tileColsLog2)
      .field("speed", &AvifOptions::speed)
      .field("subsample", &AvifOptions::subsample);

  function("encode", &encode);
}
