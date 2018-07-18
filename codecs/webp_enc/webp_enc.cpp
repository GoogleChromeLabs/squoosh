#include "emscripten.h"
#include "src/webp/encode.h"
#include <stdlib.h>
#include <emscripten/bind.h>

using namespace emscripten;

int version() {
  return WebPGetEncoderVersion();
}

int create_buffer(int width, int height) {
  return (int) malloc(width * height * 4 * sizeof(uint8_t));
}

void destroy_buffer(int p) {
  free((uint8_t*) p);
}

int result[2];
void encode(int img_in, int width, int height, float quality) {
  uint8_t* img_out;
  size_t size;
  size = WebPEncodeRGBA((uint8_t*) img_in, width, height, width * 4, quality, &img_out);
  result[0] = (int)img_out;
  result[1] = size;
}

void free_result() {
  WebPFree((void*)result[0]);
}

int get_result_pointer() {
  return result[0];
}

int get_result_size() {
  return result[1];
}

struct Foo {
  int bar;
  float world;
};

typedef Foo Foo;

int blah(Foo foo) {
  return foo.bar;
}

EMSCRIPTEN_BINDINGS(my_module) {
  value_object<Foo>("Foo")
    .field("bar", &Foo::bar)
    .field("world", &Foo::world);

  function("blah", &blah);


  function("version", &version);
  function("create_buffer", &create_buffer, allow_raw_pointers());
  function("destroy_buffer", &destroy_buffer, allow_raw_pointers());
  function("encode", &encode, allow_raw_pointers());
  function("free_result", &free_result);
  function("get_result_pointer", &get_result_pointer, allow_raw_pointers());
  function("get_result_size", &get_result_size, allow_raw_pointers());
}
