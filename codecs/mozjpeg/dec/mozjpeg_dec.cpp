#include <emscripten/bind.h>
#include <emscripten/val.h>
#include "config.h"
#include "jpeglib.h"

extern "C" {
#include "cdjpeg.h"
#include "stdio.h"
#include "setjmp.h"
}

using namespace emscripten;

struct my_error_mgr {
  struct jpeg_error_mgr pub;    /* "public" fields */
  jmp_buf setjmp_buffer;        /* for return to caller */
};

METHODDEF(void)
my_error_exit(j_common_ptr cinfo)
{
  /* cinfo->err really points to a my_error_mgr struct, so coerce pointer */
  struct my_error_mgr* myerr = (struct my_error_mgr*)cinfo->err;
  /* Return control to the setjmp point */
  longjmp(myerr->setjmp_buffer, 1);
}

thread_local const val Uint8ClampedArray = val::global("Uint8ClampedArray");
thread_local const val ImageData = val::global("ImageData");

val decode(std::string image_in) {
  uint8_t* image_buffer = (uint8_t*)image_in.c_str();

  jpeg_decompress_struct cinfo;
  my_error_mgr jerr;
  // Initialize the JPEG decompression object with custom error handling.
  cinfo.err = jpeg_std_error(&jerr.pub);
  jerr.pub.error_exit = my_error_exit;
  if (setjmp(jerr.setjmp_buffer)) {
    // The custom error handler jumps to here if an error happens.
    jpeg_destroy_decompress(&cinfo);
    char buffer[JMSG_LENGTH_MAX];
    jerr.pub.format_message((jpeg_common_struct*)&cinfo, buffer);
    return val(std::string(buffer));
  }

  jpeg_create_decompress(&cinfo);

  jpeg_mem_src(&cinfo, image_buffer, image_in.length());
  // Read file header, set default decompression parameters
  jpeg_read_header(&cinfo, TRUE);
  // Force RGBA decoding, even for grayscale images
  cinfo.out_color_space = JCS_EXT_RGBA;
  jpeg_start_decompress(&cinfo);

  // Prepare output buffer
  size_t output_size = cinfo.output_width * cinfo.output_height * 4;
  std::vector<uint8_t> output_buffer(output_size);
  auto stride = cinfo.output_width * 4;

  // Process data
  while (cinfo.output_scanline < cinfo.output_height) {
    uint8_t* ptr = &output_buffer[stride * cinfo.output_scanline];
    jpeg_read_scanlines(&cinfo, &ptr, 1);
  }
  jpeg_finish_decompress(&cinfo);

  // Step 7: release JPEG compression object

  auto data = Uint8ClampedArray.new_(typed_memory_view(output_size, &output_buffer[0]));
  auto js_result = ImageData.new_(data, cinfo.output_width, cinfo.output_height);

  // This is an important step since it will release a good deal of memory.
  jpeg_destroy_decompress(&cinfo);

  // And we're done!
  return js_result;
}

EMSCRIPTEN_BINDINGS(my_module) {
  function("decode", &decode);
}
