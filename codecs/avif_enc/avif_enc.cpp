#include "avif/avif.h"
#include <emscripten/bind.h>
#include <emscripten/val.h>

using namespace emscripten;

avifRWData output = AVIF_DATA_EMPTY;
val encode(std::string buffer, int width, int height) {
  int depth = 8;
  avifPixelFormat format = AVIF_PIXEL_FORMAT_YUV420;
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
  encoder->minQuantizer = AVIF_QUANTIZER_LOSSLESS;
  encoder->maxQuantizer = AVIF_QUANTIZER_LOSSLESS;
  avifResult encodeResult = avifEncoderWrite(encoder, image, &output);
  if (encodeResult != AVIF_RESULT_OK) {
    return val::null();
  }
  // output contains a valid .avif file's contents
  // ... output.data;
  // ... output.size;
  avifImageDestroy(image);
  avifEncoderDestroy(encoder);
  return val(typed_memory_view(output.size, output.data));
}

void free_result() { avifRWDataFree(&output); }

EMSCRIPTEN_BINDINGS(my_module) {
  function("encode", &encode);
  function("free_result", &free_result);
}
