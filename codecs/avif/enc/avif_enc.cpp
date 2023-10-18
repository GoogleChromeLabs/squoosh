#include <emscripten/bind.h>
#include <emscripten/threading.h>
#include <emscripten/val.h>
#include "avif/avif.h"

#define RETURN_NULL_IF_NOT_EQUALS(val1, val2) \
  if (val1 != val2)                           \
    return val::null();
#define RETURN_NULL_IF_EQUALS(val1, val2) \
  if (val1 == val2)                       \
    return val::null();

using namespace emscripten;

struct AvifOptions {
  // [0 - 100]
  // 0 = worst quality
  // 100 = lossless
  int quality;
  // As above, but -1 means 'use quality'
  int qualityAlpha;
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
  // 0 = auto
  // 1 = PSNR
  // 2 = SSIM
  int tune;
  // 0-50
  int denoiseLevel;
};

thread_local const val Uint8Array = val::global("Uint8Array");

val encode(std::string buffer, int width, int height, AvifOptions options) {
  avifResult status;  // To check the return status for avif API's

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

  bool lossless = options.quality == AVIF_QUALITY_LOSSLESS &&
                  (options.qualityAlpha == -1 || options.qualityAlpha == AVIF_QUALITY_LOSSLESS) &&
                  format == AVIF_PIXEL_FORMAT_YUV444;

  avifImage* image = avifImageCreate(width, height, depth, format);
  RETURN_NULL_IF_EQUALS(image, NULL);

  if (lossless) {
    image->matrixCoefficients = AVIF_MATRIX_COEFFICIENTS_IDENTITY;
  } else {
    image->matrixCoefficients = AVIF_MATRIX_COEFFICIENTS_BT601;
  }

  uint8_t* rgba = reinterpret_cast<uint8_t*>(const_cast<char*>(buffer.data()));

  avifRGBImage srcRGB;
  avifRGBImageSetDefaults(&srcRGB, image);
  srcRGB.pixels = rgba;
  srcRGB.rowBytes = width * 4;
  status = avifImageRGBToYUV(image, &srcRGB);
  RETURN_NULL_IF_NOT_EQUALS(status, AVIF_RESULT_OK);

  avifEncoder* encoder = avifEncoderCreate();
  RETURN_NULL_IF_EQUALS(encoder, NULL);

  if (lossless) {
    encoder->quality = AVIF_QUALITY_LOSSLESS;
    encoder->qualityAlpha = AVIF_QUALITY_LOSSLESS;
  } else {
    status = avifEncoderSetCodecSpecificOption(encoder, "sharpness",
                                               std::to_string(options.sharpness).c_str());
    RETURN_NULL_IF_NOT_EQUALS(status, AVIF_RESULT_OK);

    // Set base quality
    encoder->quality = options.quality;
    // Conditionally set alpha quality
    if (options.qualityAlpha == -1) {
      encoder->qualityAlpha = options.quality;
    } else {
      encoder->qualityAlpha = options.qualityAlpha;
    }

    if (options.tune == 2 || (options.tune == 0 && options.quality >= 50)) {
      status = avifEncoderSetCodecSpecificOption(encoder, "tune", "ssim");
      RETURN_NULL_IF_NOT_EQUALS(status, AVIF_RESULT_OK);
    }

    if (options.chromaDeltaQ) {
      status = avifEncoderSetCodecSpecificOption(encoder, "enable-chroma-deltaq", "1");
      RETURN_NULL_IF_NOT_EQUALS(status, AVIF_RESULT_OK);
    }

    status = avifEncoderSetCodecSpecificOption(encoder, "color:denoise-noise-level",
                                               std::to_string(options.denoiseLevel).c_str());
    RETURN_NULL_IF_NOT_EQUALS(status, AVIF_RESULT_OK);
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
      .field("quality", &AvifOptions::quality)
      .field("qualityAlpha", &AvifOptions::qualityAlpha)
      .field("tileRowsLog2", &AvifOptions::tileRowsLog2)
      .field("tileColsLog2", &AvifOptions::tileColsLog2)
      .field("speed", &AvifOptions::speed)
      .field("chromaDeltaQ", &AvifOptions::chromaDeltaQ)
      .field("sharpness", &AvifOptions::sharpness)
      .field("tune", &AvifOptions::tune)
      .field("denoiseLevel", &AvifOptions::denoiseLevel)
      .field("subsample", &AvifOptions::subsample);

  function("encode", &encode);
}
