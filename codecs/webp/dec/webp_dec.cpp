#include <string>
#include "emscripten/bind.h"
#include "emscripten/val.h"
#include "src/webp/decode.h"
#include "src/webp/demux.h"

using namespace emscripten;

int version() {
  return WebPGetDecoderVersion();
}

thread_local const val Uint8ClampedArray = val::global("Uint8ClampedArray");
thread_local const val ImageData = val::global("ImageData");

val decode(std::string buffer) {
  int width, height;
  std::unique_ptr<uint8_t[]> rgba(
      WebPDecodeRGBA((const uint8_t*)buffer.c_str(), buffer.size(), &width, &height));
  return rgba ? ImageData.new_(
                    Uint8ClampedArray.new_(typed_memory_view(width * height * 4, rgba.get())),
                    width, height)
              : val::null();
}

EMSCRIPTEN_BINDINGS(my_module) {
  function("decode", &decode);
  function("version", &version);
}
