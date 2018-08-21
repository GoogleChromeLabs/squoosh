#include "emscripten/bind.h"
#include "emscripten/val.h"
#include <stdlib.h>
#include <inttypes.h>
#include <limits.h>
#include <math.h>

#include "libimagequant.h"

using namespace emscripten;

int version() {
  return (((LIQ_VERSION/10000) % 100) << 16) |
         (((LIQ_VERSION/100  ) % 100) << 8) |
         (((LIQ_VERSION/1    ) % 100) << 0);
}

class RawImage {
public:
  val buffer;
  int width;
  int height;

  RawImage(val b, int w, int h)
    : buffer(b), width(w), height(h) {}
};


liq_attr *attr;
liq_image *image;
liq_result *res;
uint8_t* result;
RawImage quantize(std::string rawimage, int image_width, int image_height, int num_colors, float dithering) {
  const uint8_t* image_buffer = (uint8_t*)rawimage.c_str();
  int size = image_width * image_height;
  attr = liq_attr_create();
  image = liq_image_create_rgba(attr, image_buffer, image_width, image_height, 0);
  liq_set_max_colors(attr, num_colors);
  liq_image_quantize(image, attr, &res);
  liq_set_dithering_level(res, dithering);
  uint8_t* image8bit = (uint8_t*) malloc(size);
  result = (uint8_t*) malloc(size * 4);
  liq_write_remapped_image(res, image, image8bit, size);
  const liq_palette *pal = liq_get_palette(res);
  // Turn palletted image back into an RGBA image
  for(int i = 0; i < size; i++) {
    result[i * 4 + 0] = pal->entries[image8bit[i]].r;
    result[i * 4 + 1] = pal->entries[image8bit[i]].g;
    result[i * 4 + 2] = pal->entries[image8bit[i]].b;
    result[i * 4 + 3] = pal->entries[image8bit[i]].a;
  }
  free(image8bit);
  liq_result_destroy(res);
  liq_image_destroy(image);
  liq_attr_destroy(attr);
  return {
    val(typed_memory_view(image_width*image_height*4, result)),
    image_width,
    image_height
  };
}

const liq_color zx_colors[] = {
  {.a = 255, .r = 0, .g = 0, .b = 0},       // regular black
  {.a = 255, .r = 0, .g = 0, .b = 215},     // regular blue
  {.a = 255, .r = 215, .g = 0, .b = 0},     // regular red
  {.a = 255, .r = 215, .g = 0, .b = 215},   // regular magenta
  {.a = 255, .r = 0, .g = 215, .b = 0},     // regular green
  {.a = 255, .r = 0, .g = 215, .b = 215},   // regular cyan
  {.a = 255, .r = 215, .g = 215, .b = 0},   // regular yellow
  {.a = 255, .r = 215, .g = 215, .b = 215}, // regular white
  {.a = 255, .r = 0, .g = 0, .b = 255},     // bright blue
  {.a = 255, .r = 255, .g = 0, .b = 0},     // bright red
  {.a = 255, .r = 255, .g = 0, .b = 255},   // bright magenta
  {.a = 255, .r = 0, .g = 255, .b = 0},     // bright green
  {.a = 255, .r = 0, .g = 255, .b = 255},   // bright cyan
  {.a = 255, .r = 255, .g = 255, .b = 0},   // bright yellow
  {.a = 255, .r = 255, .g = 255, .b = 255}  // bright white
};

uint8_t block[8 * 8 * 4];

/**
 * The ZX has one bit per pixel, but can assign two colours to an 8x8 block. The two colours must
 * both be 'regular' or 'bright'. Black exists as both regular and bright.
 */
RawImage zx_quantize(std::string rawimage, int image_width, int image_height, float dithering) {
  const uint8_t* image_buffer = (uint8_t*) rawimage.c_str();
  int size = image_width * image_height;
  int bytes_per_pixel = 4;
  result = (uint8_t*) malloc(size * bytes_per_pixel);
  uint8_t* image8bit = (uint8_t*) malloc(8 * 8);

  // For each 8x8 grid
  for (int block_start_y = 0; block_start_y < image_height; block_start_y += 8) {
    for (int block_start_x = 0; block_start_x < image_width; block_start_x += 8) {
      int color_popularity[15] = {0};
      int block_index = 0;
      int block_width = 8;
      int block_height = 8;

      // If the block hangs off the right/bottom of the image dimensions, make it smaller to fit.
      if (block_start_y + block_height > image_height) {
        block_height = image_height - block_start_y;
      }

      if (block_start_x + block_width > image_width) {
        block_width = image_width - block_start_x;
      }

      // For each pixel in that block:
      for (int y = block_start_y; y < block_start_y + block_height; y++) {
        for (int x = block_start_x; x < block_start_x + block_width; x++) {
          int pixel_start = (y * image_width * bytes_per_pixel) + (x * bytes_per_pixel);
          int smallest_distance = INT_MAX;
          int winning_index = -1;

          // Copy pixel data for quantizing later
          block[block_index++] = image_buffer[pixel_start];
          block[block_index++] = image_buffer[pixel_start + 1];
          block[block_index++] = image_buffer[pixel_start + 2];
          block[block_index++] = image_buffer[pixel_start + 3];

          // Which zx color is this pixel closest to?
          for (int color_index = 0; color_index < 15; color_index++) {
            liq_color color = zx_colors[color_index];

            // Using Euclidean distance. LibQuant has better methods, but it requires conversion to
            // LAB, so I don't think it's worth it.
            int distance =
              pow(color.r - image_buffer[pixel_start + 0], 2) +
              pow(color.g - image_buffer[pixel_start + 1], 2) +
              pow(color.b - image_buffer[pixel_start + 2], 2);

            if (distance < smallest_distance) {
              winning_index = color_index;
              smallest_distance = distance;
            }
          }
          color_popularity[winning_index]++;
        }
      }

      // Get the three most popular colours for the block.
      int first_color_index = 0;
      int second_color_index = 0;
      int third_color_index = 0;
      int highest_popularity = -1;
      int second_highest_popularity = -1;
      int third_highest_popularity = -1;

      for (int color_index = 0; color_index < 15; color_index++) {
        if (color_popularity[color_index] > highest_popularity) {
          // Store this as the most popular pixel, and demote the current values:
          third_color_index = second_color_index;
          third_highest_popularity = second_highest_popularity;
          second_color_index = first_color_index;
          second_highest_popularity = highest_popularity;
          first_color_index = color_index;
          highest_popularity = color_popularity[color_index];
        } else if (color_popularity[color_index] > second_highest_popularity) {
          third_color_index = second_color_index;
          third_highest_popularity = second_highest_popularity;
          second_color_index = color_index;
          second_highest_popularity = color_popularity[color_index];
        } else if (color_popularity[color_index] > third_highest_popularity) {
          third_color_index = color_index;
          third_highest_popularity = color_popularity[color_index];
        }
      }

      // ZX images can't mix bright and regular colours, except black which appears in both.
      // Resolve any conflict:
      while (1) {
        // If either colour is black, there's no conflict to resolve.
        if (first_color_index != 0 && second_color_index != 0) {
          if (first_color_index >= 8 && second_color_index < 8) {
            // Make the second color bright
            second_color_index = second_color_index + 7;
          } else if (first_color_index < 8 && second_color_index >= 8) {
            // Make the second color regular
            second_color_index = second_color_index - 7;
          }
        }

        // If, during conflict resolving, we now have two of the same colour (because we initially
        // selected the bright & regular version of the same colour), retry again with the third
        // most popular colour.
        if (first_color_index == second_color_index) {
          second_color_index = third_color_index;
        } else break;
      }

      // Quantize
      attr = liq_attr_create();
      image = liq_image_create_rgba(attr, block, block_width, block_height, 0);
      liq_set_max_colors(attr, 2);
      liq_image_add_fixed_color(image, zx_colors[first_color_index]);
      liq_image_add_fixed_color(image, zx_colors[second_color_index]);
      liq_image_quantize(image, attr, &res);
      liq_set_dithering_level(res, dithering);
      liq_write_remapped_image(res, image, image8bit, size);
      const liq_palette *pal = liq_get_palette(res);

      // Turn palletted image back into an RGBA image, and write it into the full size result image.
      for(int y = 0; y < block_height; y++) {
        for(int x = 0; x < block_width; x++) {
          int image8BitPos = y * block_width + x;
          int resultStartPos = ((block_start_y + y) * bytes_per_pixel * image_width) + ((block_start_x + x) * bytes_per_pixel);
          result[resultStartPos + 0] = pal->entries[image8bit[image8BitPos]].r;
          result[resultStartPos + 1] = pal->entries[image8bit[image8BitPos]].g;
          result[resultStartPos + 2] = pal->entries[image8bit[image8BitPos]].b;
          result[resultStartPos + 3] = pal->entries[image8bit[image8BitPos]].a;
        }
      }

      liq_result_destroy(res);
      liq_image_destroy(image);
      liq_attr_destroy(attr);
    }
  }

  free(image8bit);
  return {
    val(typed_memory_view(image_width*image_height*4, result)),
    image_width,
    image_height
  };
}

void free_result() {
  free(result);
}

EMSCRIPTEN_BINDINGS(my_module) {
  class_<RawImage>("RawImage")
    .property("buffer", &RawImage::buffer)
    .property("width", &RawImage::width)
    .property("height", &RawImage::height);

  function("quantize", &quantize);
  function("zx_quantize", &zx_quantize);
  function("version", &version);
  function("free_result", &free_result);
}
