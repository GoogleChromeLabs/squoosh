#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <cstdio>
#include "src/wp2/decode.h"

using namespace emscripten;

thread_local const val Uint8ClampedArray = val::global("Uint8ClampedArray");
thread_local const val ImageData = val::global("ImageData");

val decode(std::string image_in) {
  WP2::ArgbBuffer buffer(WP2_rgbA_32);
  WP2Status status = WP2::Decode(image_in, &buffer);
  if (status != WP2_STATUS_OK) {
    return val::null();
  }
  return ImageData.new_(Uint8ClampedArray.new_(typed_memory_view(buffer.stride() * buffer.height(),
                                                                 buffer.GetRow8(0))),
                        buffer.width(), buffer.height());
}

EMSCRIPTEN_BINDINGS(my_module) {
  function("decode", &decode);
}
