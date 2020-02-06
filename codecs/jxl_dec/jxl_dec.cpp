#include <emscripten/bind.h>
#include <emscripten/val.h>

#include "jxl/dec_file.h"

using namespace emscripten;

class RawImage {
public:
  val buffer;
  int width;
  int height;

  RawImage(val b, int w, int h) : buffer(b), width(w), height(h) {}
};

val decode(std::string data) {
  jxl::Span<const uint8_t> compressed((uint8_t *)data.c_str(), data.length());
  jxl::DecompressParams dparams;
  // jxl::ThreadPool pool;
  jxl::CodecInOut io;
  jxl::AuxOut aux_out;

  if (!DecodeFile(dparams, compressed, &io, &aux_out, NULL)) {
    printf("FAIL\n");
  }
  printf("YAY\n");
  return val(1);
}

EMSCRIPTEN_BINDINGS(my_module) {
  class_<RawImage>("RawImage")
      .property("buffer", &RawImage::buffer)
      .property("width", &RawImage::width)
      .property("height", &RawImage::height);

  function("decode", &decode);
}
