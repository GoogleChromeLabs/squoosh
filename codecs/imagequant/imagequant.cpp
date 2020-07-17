#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <inttypes.h>
#include <limits.h>
#include <math.h>
#include <stdlib.h>

#include "libimagequant.h"

using namespace emscripten;

int version() {
  return (((LIQ_VERSION / 10000) % 100) << 16) | (((LIQ_VERSION / 100) % 100) << 8) |
         (((LIQ_VERSION / 1) % 100) << 0);
}

thread_local const val Uint8ClampedArray = val::global("Uint8ClampedArray");

#define liq_ptr(T) std::unique_ptr<T, std::integral_constant<decltype(&T##_destroy), T##_destroy>>

using liq_attr_ptr = liq_ptr(liq_attr);
using liq_image_ptr = liq_ptr(liq_image);
using liq_result_ptr = liq_ptr(liq_result);

liq_result_ptr liq_image_quantize(liq_image* image, liq_attr* attr) {
  liq_result* res = nullptr;
  liq_image_quantize(image, attr, &res);
  return liq_result_ptr(res);
}

val quantize(std::string rawimage,
             int image_width,
             int image_height,
             int num_colors,
             float dithering) {
  auto image_buffer = (const liq_color*)rawimage.c_str();
  int size = image_width * image_height;
  liq_attr_ptr attr(liq_attr_create());
  liq_image_ptr image(
      liq_image_create_rgba(attr.get(), image_buffer, image_width, image_height, 0));
  liq_set_max_colors(attr.get(), num_colors);
  auto res = liq_image_quantize(image.get(), attr.get());
  liq_set_dithering_level(res.get(), dithering);
  std::vector<uint8_t> image8bit(size);
  std::vector<liq_color> result(size);
  liq_write_remapped_image(res.get(), image.get(), image8bit.data(), image8bit.size());
  auto pal = liq_get_palette(res.get());
  // Turn palletted image back into an RGBA image
  for (int i = 0; i < size; i++) {
    result[i] = pal->entries[image8bit[i]];
  }
  return Uint8ClampedArray.new_(
      typed_memory_view(result.size() * sizeof(liq_color), (const uint8_t*)result.data()));
}

const liq_color zx_colors[] = {
    {.r = 0, .g = 0, .b = 0, .a = 255},        // regular black
    {.r = 0, .g = 0, .b = 215, .a = 255},      // regular blue
    {.r = 215, .g = 0, .b = 0, .a = 255},      // regular red
    {.r = 215, .g = 0, .b = 215, .a = 255},    // regular magenta
    {.r = 0, .g = 215, .b = 0, .a = 255},      // regular green
    {.r = 0, .g = 215, .b = 215, .a = 255},    // regular cyan
    {.r = 215, .g = 215, .b = 0, .a = 255},    // regular yellow
    {.r = 215, .g = 215, .b = 215, .a = 255},  // regular white
    {.r = 0, .g = 0, .b = 255, .a = 255},      // bright blue
    {.r = 255, .g = 0, .b = 0, .a = 255},      // bright red
    {.r = 255, .g = 0, .b = 255, .a = 255},    // bright magenta
    {.r = 0, .g = 255, .b = 0, .a = 255},      // bright green
    {.r = 0, .g = 255, .b = 255, .a = 255},    // bright cyan
    {.r = 255, .g = 255, .b = 0, .a = 255},    // bright yellow
    {.r = 255, .g = 255, .b = 255, .a = 255}   // bright white
};

/**
 * The ZX has one bit per pixel, but can assign two colours to an 8x8 block. The
 * two colours must both be 'regular' or 'bright'. Black exists as both regular
 * and bright.
 */
val zx_quantize(std::string rawimage, int image_width, int image_height, float dithering) {
  auto image_buffer = (const liq_color*)rawimage.c_str();
  int size = image_width * image_height;
  liq_color block[8 * 8];
  uint8_t image8bit[8 * 8];
  std::vector<liq_color> result(size);

  // For each 8x8 grid
  for (int block_start_y = 0; block_start_y < image_height; block_start_y += 8) {
    for (int block_start_x = 0; block_start_x < image_width; block_start_x += 8) {
      int color_popularity[15] = {0};
      int block_index = 0;
      int block_width = 8;
      int block_height = 8;

      // If the block hangs off the right/bottom of the image dimensions, make
      // it smaller to fit.
      if (block_start_y + block_height > image_height) {
        block_height = image_height - block_start_y;
      }

      if (block_start_x + block_width > image_width) {
        block_width = image_width - block_start_x;
      }

      // For each pixel in that block:
      for (int y = block_start_y; y < block_start_y + block_height; y++) {
        for (int x = block_start_x; x < block_start_x + block_width; x++) {
          int pixel_start = (y * image_width) + x;
          int smallest_distance = INT_MAX;
          int winning_index = -1;

          // Copy pixel data for quantizing later
          block[block_index++] = image_buffer[pixel_start];

          // Which zx color is this pixel closest to?
          for (int color_index = 0; color_index < 15; color_index++) {
            liq_color color = zx_colors[color_index];
            liq_color pixel = image_buffer[pixel_start];

            // Using Euclidean distance. LibQuant has better methods, but it
            // requires conversion to LAB, so I don't think it's worth it.
            int distance =
                pow(color.r - pixel.r, 2) + pow(color.g - pixel.g, 2) + pow(color.b - pixel.b, 2);

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
          // Store this as the most popular pixel, and demote the current
          // values:
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

      // ZX images can't mix bright and regular colours, except black which
      // appears in both. Resolve any conflict:
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

        // If, during conflict resolving, we now have two of the same colour
        // (because we initially selected the bright & regular version of the
        // same colour), retry again with the third most popular colour.
        if (first_color_index == second_color_index) {
          second_color_index = third_color_index;
        } else
          break;
      }

      // Quantize
      liq_attr_ptr attr(liq_attr_create());
      liq_image_ptr image(liq_image_create_rgba(attr.get(), block, block_width, block_height, 0));
      liq_set_max_colors(attr.get(), 2);
      liq_image_add_fixed_color(image.get(), zx_colors[first_color_index]);
      liq_image_add_fixed_color(image.get(), zx_colors[second_color_index]);
      auto res = liq_image_quantize(image.get(), attr.get());
      liq_set_dithering_level(res.get(), dithering);
      liq_write_remapped_image(res.get(), image.get(), image8bit, size);
      auto pal = liq_get_palette(res.get());

      // Turn palletted image back into an RGBA image, and write it into the
      // full size result image.
      for (int y = 0; y < block_height; y++) {
        for (int x = 0; x < block_width; x++) {
          int image8BitPos = y * block_width + x;
          int resultStartPos = ((block_start_y + y) * image_width) + (block_start_x + x);
          result[resultStartPos] = pal->entries[image8bit[image8BitPos]];
        }
      }
    }
  }

  return Uint8ClampedArray.new_(
      typed_memory_view(result.size() * sizeof(liq_color), (const uint8_t*)result.data()));
}

EMSCRIPTEN_BINDINGS(my_module) {
  function("quantize", &quantize);
  function("zx_quantize", &zx_quantize);
  function("version", &version);
}
