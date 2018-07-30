#include "emscripten.h"
#include <stdlib.h>
#include <inttypes.h>

#include "libimagequant.h"

EMSCRIPTEN_KEEPALIVE
int version() {
  return (((LIQ_VERSION/10000) % 100) << 16) |
         (((LIQ_VERSION/100  ) % 100) << 8) |
         (((LIQ_VERSION/1    ) % 100) << 0);
}

EMSCRIPTEN_KEEPALIVE
uint8_t* create_buffer(int width, int height) {
  return malloc(width * height * 4 * sizeof(uint8_t));
}

EMSCRIPTEN_KEEPALIVE
void destroy_buffer(uint8_t* p) {
  free(p);
}

liq_attr *attr;
liq_image *image;
liq_result *res;
int result[2];
EMSCRIPTEN_KEEPALIVE
void quantize(uint8_t* image_buffer, int image_width, int image_height, int num_colors, float dithering) {
  int size = image_width * image_height;
  attr = liq_attr_create();
  image = liq_image_create_rgba(attr, image_buffer, image_width, image_height, 0);
  liq_set_max_colors(attr, 16);
  liq_image_quantize(image, attr, &res);
  liq_set_dithering_level(res, dithering);
  uint8_t* image8bit = (uint8_t*) malloc(size);
  result[0] = (int) malloc(size * 4);
  liq_write_remapped_image(res, image, image8bit, size);
  const liq_palette *pal = liq_get_palette(res);
  // Turn palletted image back into an RGBA image
  for(int i = 0; i < size; i++) {
    ((uint8_t*)result[0])[i * 4 + 0] = pal->entries[image8bit[i]].r;
    ((uint8_t*)result[0])[i * 4 + 1] = pal->entries[image8bit[i]].g;
    ((uint8_t*)result[0])[i * 4 + 2] = pal->entries[image8bit[i]].b;
    ((uint8_t*)result[0])[i * 4 + 3] = pal->entries[image8bit[i]].a;
  }
  free(image8bit);
  liq_result_destroy(res);
  liq_image_destroy(image);
  liq_attr_destroy(attr);
}

EMSCRIPTEN_KEEPALIVE
void free_result() {
  free(result[0]);
}

EMSCRIPTEN_KEEPALIVE
int get_result_pointer() {
  return result[0];
}

EMSCRIPTEN_KEEPALIVE
int get_result_palette_pointer() {
  return result[1];
}

