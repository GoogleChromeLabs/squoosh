#include <emscripten/bind.h>
#include <emscripten/val.h>

#define QOI_IMPLEMENTATION
#include "qoi.h"

using namespace emscripten;

struct QoiOptions {
  int quality;
  bool randombool;
};

thread_local const val Uint8Array = val::global("Uint8Array");

val encode(std::string buffer, int width, int height, QoiOptions options) {
  printf("Starting encode!");

  printf("quality = %d\n", options.quality);
  printf("randombool = %s\n", options.randombool ? "true" : "false");

  auto js_result = val::null();

  const int N = 100;
  int* data = (int*)malloc(N * sizeof(int));

  js_result = Uint8Array.new_(typed_memory_view(N, data));
  return js_result;
}

EMSCRIPTEN_BINDINGS(my_module) {
  value_object<QoiOptions>("QoiOptions")
      .field("quality", &QoiOptions::quality)
      .field("randombool", &QoiOptions::randombool);

  function("encode", &encode);
}
