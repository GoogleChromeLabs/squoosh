#include <emscripten/bind.h>
#include <emscripten/val.h>

#define QOI_IMPLEMENTATION
#include "qoi.h"

using namespace emscripten;

thread_local const val Uint8ClampedArray = val::global("Uint8ClampedArray");
thread_local const val ImageData = val::global("ImageData");

val decode(std::string qoiimage) {
  val result = val::null();

  const int N = 1000;
  int data[N] = {0};

  result = ImageData.new_(Uint8ClampedArray.new_(typed_memory_view(N, data)), 20, 50);

  return result;
}

EMSCRIPTEN_BINDINGS(my_module) {
  function("decode", &decode);
}
