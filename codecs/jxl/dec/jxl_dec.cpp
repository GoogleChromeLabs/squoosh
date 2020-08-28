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

uint8_t clamp(float v, float min, float max) {
  if (v < min) {
    return min;
  }
  if (v > max) {
    return max;
  }
  return v;
}

uint8_t* result;
RawImage decode(std::string data) {
  jxl::Span<const uint8_t> compressed((uint8_t*)data.c_str(), data.length());
  jxl::DecompressParams dparams;
  // jxl::ThreadPool pool;
  jxl::CodecInOut io;
  jxl::AuxOut aux_out;

  if (!DecodeFile(dparams, compressed, &io, &aux_out, NULL)) {
    return RawImage(val::null(), -1, -1);
  }
  jxl::ImageBundle* main = &io.Main();
  if (!main->HasColor()) {
    return RawImage(val::null(), -1, -1);
  }
  const jxl::Image3F* buffer = &main->color();
  int width = buffer->xsize();
  int height = buffer->ysize();
  result = new uint8_t[width * height * 4];
  bool has_alpha = main->HasAlpha();
  for (int y = 0; y < height; y++) {
    const float* red = buffer->PlaneRow(0, y);
    const float* green = buffer->PlaneRow(1, y);
    const float* blue = buffer->PlaneRow(2, y);
    for (int x = 0; x < width; x++) {
      int pixelOffset = width * y + x;
      result[pixelOffset * 4 + 0] = clamp(red[x], 0, 255);
      result[pixelOffset * 4 + 1] = clamp(green[x], 0, 255);
      result[pixelOffset * 4 + 2] = clamp(blue[x], 0, 255);
      if (has_alpha) {
        result[pixelOffset * 4 + 3] = (uint8_t)(main->alpha().ConstRow(y)[x] & 0xFF);
      } else {
        result[pixelOffset * 4 + 3] = 255;
      }
    }
  }

  return RawImage(val(typed_memory_view(width * height * 4, result)), width, height);
}

void free_result() {
  delete result;
}

EMSCRIPTEN_BINDINGS(my_module) {
  class_<RawImage>("RawImage")
      .property("buffer", &RawImage::buffer)
      .property("width", &RawImage::width)
      .property("height", &RawImage::height);

  function("decode", &decode);
  function("free_result", &free_result);
}
