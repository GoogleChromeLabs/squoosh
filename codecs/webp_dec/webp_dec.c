#include "emscripten.h"
#include "src/webp/decode.h"
#include "src/webp/demux.h"
#include <stdlib.h>

EMSCRIPTEN_KEEPALIVE
int version() {
  return WebPGetDecoderVersion();
}

EMSCRIPTEN_KEEPALIVE
uint8_t* create_buffer(int size) {
  return malloc(size);
}

EMSCRIPTEN_KEEPALIVE
void destroy_buffer(uint8_t* p) {
  free(p);
}

int result[3];
EMSCRIPTEN_KEEPALIVE
void decode(uint8_t* img_in, int size) {
  int width, height;
  uint8_t* img_out = WebPDecodeRGBA(img_in, size, &width, &height);
  result[0] = (int)img_out;
  result[1] = width;
  result[2] = height;

}

EMSCRIPTEN_KEEPALIVE
void free_result() {
  WebPFree(result[0]);
}

EMSCRIPTEN_KEEPALIVE
int get_result_pointer() {
  return result[0];
}

EMSCRIPTEN_KEEPALIVE
int get_result_width() {
  return result[1];
}

EMSCRIPTEN_KEEPALIVE
int get_result_height() {
  return result[2];
}

