#include <emscripten/bind.h>
#include <emscripten/val.h>

#define QOI_IMPLEMENTATION
#include "qoi.h"

using namespace emscripten;

struct QoiOptions {};

thread_local const val Uint8Array = val::global("Uint8Array");

val encode(std::string buffer, int width, int height, QoiOptions options) {
  int compressedSizeInBytes;
  qoi_desc desc;
  desc.width = width;
  desc.height = height;
  desc.channels = 4;
  desc.colorspace = QOI_SRGB;

  uint8_t* encodedData = (uint8_t*)qoi_encode(buffer.c_str(), &desc, &compressedSizeInBytes);
  if (encodedData == NULL)
    return val::null();

  auto js_result =
      Uint8Array.new_(typed_memory_view(compressedSizeInBytes, (const uint8_t*)encodedData));
  free(encodedData);

  return js_result;
}

EMSCRIPTEN_BINDINGS(my_module) {
  value_object<QoiOptions>("QoiOptions");

  function("encode", &encode);
}
