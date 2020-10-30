#include <cstdio>
#include <emscripten/bind.h>
#include <emscripten/val.h>

#include "src/wp2/decode.h"
using namespace emscripten;

class RawImage {
public:
  val buffer;
  int width;
  int height;

  RawImage(val b, int w, int h) : buffer(b), width(w), height(h) {}
};

WP2::ArgbBuffer *buffer = new WP2::ArgbBuffer(WP2_rgbA_32);

RawImage decode(std::string image_in) {
  WP2Status status;
  status = WP2::Decode(image_in, buffer);
  if (status != WP2_STATUS_OK) {
    return RawImage(val::null(), -1, -1);
  }
  return RawImage(val(typed_memory_view(buffer->width * buffer->height * 4,
                                        (uint8_t *)buffer->GetRow(0))),
                  buffer->width, buffer->height);
}

void free_result() { delete buffer; }

EMSCRIPTEN_BINDINGS(my_module) {
  class_<RawImage>("RawImage")
      .property("buffer", &RawImage::buffer)
      .property("width", &RawImage::width)
      .property("height", &RawImage::height);

  function("decode", &decode);
  function("free_result", &free_result);
}
