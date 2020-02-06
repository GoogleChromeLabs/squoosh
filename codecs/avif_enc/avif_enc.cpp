#include "avif/avif.h"
#include <emscripten/bind.h>
#include <emscripten/val.h>

using namespace emscripten;

struct AvifOptions {
  // [0 - 63]
  // 0 = lossless
  // 63 = worst quality
  int minQuantizer;
  int maxQuantizer;
  // [0 - 6]
  // Creates 2^n tiles in that dimension
  int tileRowsLog2;
  int tileColsLog2;
  // [0 - 10]
  // 0 = slowest
  // 10 = fastest
  int speed;
  // 0 = 4:2:0
  // 1 = 4:2:2
  // 2 = 4:4:4
  int subsample;
};

avifRWData output = AVIF_DATA_EMPTY;
val encode(std::string buffer, int width, int height, AvifOptions options) {
  int depth = 8;
  avifPixelFormat format;
  switch (options.subsample) {
  case 0:
    format = AVIF_PIXEL_FORMAT_YUV420;
    break;
  case 1:
    format = AVIF_PIXEL_FORMAT_YUV422;
    break;
  case 2:
    format = AVIF_PIXEL_FORMAT_YUV444;
    break;
  }
  avifImage *image = avifImageCreate(width, height, depth, format);

  uint8_t *rgba = (uint8_t *)buffer.c_str();

  avifImageAllocatePlanes(image, AVIF_PLANES_RGB);
  avifImageAllocatePlanes(image, AVIF_PLANES_A);

  for (int y = 0; y < height; y++) {
    for (int x = 0; x < width; x++) {
      int pixelOffset = y * width + x;
      image->rgbPlanes[0][pixelOffset] = rgba[pixelOffset * 4 + 0];
      image->rgbPlanes[1][pixelOffset] = rgba[pixelOffset * 4 + 1];
      image->rgbPlanes[2][pixelOffset] = rgba[pixelOffset * 4 + 2];
      image->alphaPlane[pixelOffset] = rgba[pixelOffset * 4 + 3];
    }
  }

  avifEncoder *encoder = avifEncoderCreate();
  encoder->maxThreads = 1;
  encoder->minQuantizer = options.minQuantizer;
  encoder->maxQuantizer = options.maxQuantizer;
  encoder->tileRowsLog2 = options.tileRowsLog2;
  encoder->tileColsLog2 = options.tileColsLog2;
  encoder->speed = options.speed;
  avifResult encodeResult = avifEncoderWrite(encoder, image, &output);
  if (encodeResult != AVIF_RESULT_OK) {
    return val::null();
  }
  avifImageDestroy(image);
  avifEncoderDestroy(encoder);
  return val(typed_memory_view(output.size, output.data));
}

void free_result() { avifRWDataFree(&output); }

EMSCRIPTEN_BINDINGS(my_module) {
  value_object<AvifOptions>("AvifOptions")
      .field("minQuantizer", &AvifOptions::minQuantizer)
      .field("maxQuantizer", &AvifOptions::maxQuantizer)
      .field("tileRowsLog2", &AvifOptions::tileRowsLog2)
      .field("tileColsLog2", &AvifOptions::tileColsLog2)
      .field("speed", &AvifOptions::speed)
      .field("subsample", &AvifOptions::subsample);

  function("encode", &encode);
  function("free_result", &free_result);
}
