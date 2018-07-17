#include "emscripten.h"
#include "src/webp/encode.h"
#include <stdlib.h>
#include <emscripten/bind.h>

using namespace emscripten;

int version() {
  return WebPGetEncoderVersion();
}

uint8_t* create_buffer(int width, int height) {
  return (uint8_t*) malloc(width * height * 4 * sizeof(uint8_t));
}

void destroy_buffer(uint8_t* p) {
  free(p);
}

int result[2];
void encode(uint8_t* img_in, int width, int height, float quality) {
  uint8_t* img_out;
  size_t size;
  size = WebPEncodeRGBA(img_in, width, height, width * 4, quality, &img_out);
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

/*struct Vector3d
{
  double x;
  double y;
  double z;
};
*/

EMSCRIPTEN_BINDINGS(my_module) {
  function("version", &version);
  function("create_buffer", &create_buffer, allow_raw_pointers());
  function("destroy_buffer", &destroy_buffer, allow_raw_pointers());
  function("encode", &encode, allow_raw_pointers());
  function("free_result", &free_result, allow_raw_pointers());
  function("get_result_pointer", &get_result_pointer, allow_raw_pointers());
  function("get_result_size", &get_result_size, allow_raw_pointers());
}
