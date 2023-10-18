#include <emscripten/bind.h>
#include <emscripten/val.h>

#define QOI_IMPLEMENTATION
#include "qoi.h"

using namespace emscripten;

thread_local const val Uint8ClampedArray = val::global("Uint8ClampedArray");
thread_local const val ImageData = val::global("ImageData");

val decode(std::string qoiimage) {
  qoi_desc desc;
  uint8_t* rgba = (uint8_t*)qoi_decode(qoiimage.c_str(), qoiimage.length(), &desc, 4);

  // Resultant width and height stored in descriptor
  int decodedWidth = desc.width;
  int decodedHeight = desc.height;

  val result = ImageData.new_(
      Uint8ClampedArray.new_(typed_memory_view(4 * decodedWidth * decodedHeight, rgba)),
      decodedWidth, decodedHeight);
  free(rgba);

  return result;
}

EMSCRIPTEN_BINDINGS(my_module) {
  function("decode", &decode);
}
