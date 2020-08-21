#include <emscripten/bind.h>
#include <emscripten/val.h>
#include "config.h"
#include "jpeglib.h"

extern "C" {
#include "cdjpeg.h"
}

using namespace emscripten;

thread_local const val Uint8ClampedArray = val::global("Uint8ClampedArray");
thread_local const val ImageData = val::global("ImageData");

val decode(std::string image_in) {
  uint8_t* image_buffer = (uint8_t*)image_in.c_str();

  struct jpeg_decompress_struct cinfo;
  struct jpeg_error_mgr jerr;
  /* Initialize the JPEG decompression object with default error handling. */
  cinfo.err = jpeg_std_error(&jerr);
  jpeg_create_decompress(&cinfo);

  jpeg_mem_src(&cinfo, image_buffer, image_in.length());
  /* Read file header, set default decompression parameters */
  jpeg_read_header(&cinfo, TRUE);
  // Force RGB decoding, even for grayscale images
  cinfo.out_color_space = JCS_RGB;
  jpeg_start_decompress(&cinfo);

  // Prepare output buffer
  size_t output_size = cinfo.output_width * cinfo.output_height * 4;
  auto output_buffer = new uint8_t[output_size];
  uint8_t* row_ptr = &output_buffer[0];
  auto stride = cinfo.output_width * 4;

  /* Process data */
  while (cinfo.output_scanline < cinfo.output_height) {
    jpeg_read_scanlines(&cinfo, &row_ptr, 1);
    // Turn that row from RGB into RGBA. I’m starting at the end so
    // I can do it in-place.
    for (int32_t x = cinfo.output_width - 1; x >= 0; x--) {
      // RGB channels
      for (auto i = 0; i < 3; i++) {
        row_ptr[x * 4 + i] = row_ptr[x * 3 + i];
      }
      // Alpha channel
      row_ptr[x * 4 + 3] = 255;
    }
    row_ptr += stride;
  }
  jpeg_finish_decompress(&cinfo);

  /* Step 7: release JPEG compression object */

  auto data = Uint8ClampedArray.new_(typed_memory_view(output_size, output_buffer));
  auto js_result = ImageData.new_(data, cinfo.output_width, cinfo.output_height);

  /* This is an important step since it will release a good deal of memory. */
  jpeg_destroy_decompress(&cinfo);
  delete[] output_buffer;

  /* And we're done! */
  return js_result;
}

EMSCRIPTEN_BINDINGS(my_module) {
  function("decode", &decode);
}
