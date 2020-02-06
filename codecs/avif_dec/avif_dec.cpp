#include "avif/avif.h"
#include <emscripten/bind.h>
#include <emscripten/val.h>

using namespace emscripten;

class RawImage {
public:
  val buffer;
  int width;
  int height;

  RawImage(val b, int w, int h) : buffer(b), width(w), height(h) {}
};
// NOTE: avifDecoderRead() offers the simplest means to get an avifImage that is
// complete independent of an avifDecoder, but at the cost of additional
// allocations and copies, and no support for image sequences. If you don't mind
// keeping around the avifDecoder while you read in the image and/or need image
// sequence support, skip ahead to the Advanced Decoding example. It is only one
// additional function call, and the avifImage is owned by the avifDecoder.

uint8_t *result;
RawImage decode(std::string avifimage) {
  // point raw.data and raw.size to the contents of an .avif(s)
  avifROData raw;
  raw.data = (uint8_t *)avifimage.c_str();
  raw.size = avifimage.length();

  avifImage *image = avifImageCreateEmpty();
  avifDecoder *decoder = avifDecoderCreate();
  avifResult decodeResult = avifDecoderRead(decoder, image, &raw);
  if (decodeResult != AVIF_RESULT_OK) {
    return RawImage(val::null(), -1, -1);
    // printf("ERROR: Failed to decode: %s\n", avifResultToString(result));
  }

  int width = image->width;
  int height = image->height;
  int numBytes = width * height * 4;
  result = new uint8_t[numBytes];

  // image is an independent copy of decoded data, decoder may be destroyed here

  // ... image->width;
  // ... image->height;
  // ... image->depth;     // If >8, all plane ptrs below are uint16_t*
  // ... image->yuvFormat; // U and V planes might be smaller than Y based on
  // format, use avifGetPixelFormatInfo() to find out in a generic way

  // Option 1: Use YUV planes directly
  // ... image->yuvPlanes;
  // ... image->yuvRowBytes;

  // Option 2: Convert to RGB and use RGB planes
  avifImageYUVToRGB(image);
  // ... image->rgbPlanes;
  // ... image->rgbRowBytes;

  if (image->depth > 8) {
    uint16_t depthDivistor = 1 << (image->depth - 8);
    // Plane ptrs are uint16_t*
    for (int y = 0; y < height; y++) {
      for (int x = 0; x < width; x++) {
        int pixelOffset = y * image->width + x;
        result[pixelOffset * 4 + 0] = (uint8_t)(
            ((uint16_t *)(image->rgbPlanes[0]))[pixelOffset] / depthDivistor);
        result[pixelOffset * 4 + 1] = (uint8_t)(
            ((uint16_t *)(image->rgbPlanes[1]))[pixelOffset] / depthDivistor);
        result[pixelOffset * 4 + 2] = (uint8_t)(
            ((uint16_t *)(image->rgbPlanes[2]))[pixelOffset] / depthDivistor);
        if (image->alphaPlane) {
          result[pixelOffset * 4 + 3] = (uint8_t)(
              ((uint16_t *)(image->alphaPlane))[pixelOffset] / depthDivistor);
        } else {
          result[pixelOffset * 4 + 3] = 255;
        }
      }
    }

  } else {
    // Plane ptrs are uint8_t*
    for (int y = 0; y < height; y++) {
      for (int x = 0; x < width; x++) {
        int pixelOffset = y * image->width + x;
        result[pixelOffset * 4 + 0] = image->rgbPlanes[0][pixelOffset];
        result[pixelOffset * 4 + 1] = image->rgbPlanes[1][pixelOffset];
        result[pixelOffset * 4 + 2] = image->rgbPlanes[2][pixelOffset];
        if (image->alphaPlane) {
          result[pixelOffset * 4 + 3] = image->alphaPlane[pixelOffset];
        } else {
          result[pixelOffset * 4 + 3] = 255;
        }
      }
    }
  }

  // // Use alpha plane, if present
  // if (image->alphaPlane) {
  //     ... image->alphaPlane;
  //     ... image->alphaRowBytes;
  // }

  avifImageDestroy(image);
  avifDecoderDestroy(decoder);

  return RawImage(val(typed_memory_view(numBytes, result)), (int)width,
                  (int)height);
}

void free_result() { delete result; }

EMSCRIPTEN_BINDINGS(my_module) {
  class_<RawImage>("RawImage")
      .property("buffer", &RawImage::buffer)
      .property("width", &RawImage::width)
      .property("height", &RawImage::height);

  function("decode", &decode);
  function("free_result", &free_result);
}
