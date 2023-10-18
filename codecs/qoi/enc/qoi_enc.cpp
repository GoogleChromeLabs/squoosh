#include <emscripten/bind.h>
#include <emscripten/val.h>

#include <vector>

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
  desc.channels = 3;
  desc.colorspace = QOI_SRGB;

  auto rgba_buffer = buffer.c_str();
  auto num_pixels = width * height;
  std::vector<uint8_t> rgb_buffer(num_pixels * 3);
  for(auto i = 0; i < num_pixels; i ++) {
    rgb_buffer[i*3 + 0] = rgba_buffer[i*4 +0];
    rgb_buffer[i*3 + 1] = rgba_buffer[i*4 +1];
    rgb_buffer[i*3 + 2] = rgba_buffer[i*4 +2];
  }

  void* encodedData = qoi_encode(rgb_buffer.data(), &desc, &compressedSizeInBytes);
  if (encodedData == NULL)
    return val::null();

  auto js_result =
      Uint8Array.new_(typed_memory_view(compressedSizeInBytes, (const uint8_t*)encodedData));
  return js_result;
}

EMSCRIPTEN_BINDINGS(my_module) {
  value_object<QoiOptions>("QoiOptions");

  function("encode", &encode);
}
