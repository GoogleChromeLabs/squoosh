#include "emscripten/bind.h"
#include "emscripten/val.h"
#include "src/webp/decode.h"
#include "src/webp/demux.h"
#include <string>

using namespace emscripten;

int version() {
  return WebPGetDecoderVersion();
}

class RawImage {
public:
  val buffer;
  int width;
  int height;

  RawImage(val b, int w, int h)
    : buffer(b), width(w), height(h) {}
};

uint8_t* last_result;
RawImage decode(std::string buffer) {
  int width, height;
  last_result = WebPDecodeRGBA((const uint8_t*)buffer.c_str(), buffer.size(), &width, &height);
  return RawImage(
    val(typed_memory_view(width*height*4, last_result)),
    width,
    height
  );
}

void free_result() {
  free(last_result);
}

EMSCRIPTEN_BINDINGS(my_module) {
  class_<RawImage>("RawImage")
    .property("buffer", &RawImage::buffer)
    .property("width", &RawImage::width)
    .property("height", &RawImage::height);

  function("decode", &decode);
  function("version", &version);
  function("free_result", &free_result);
}
