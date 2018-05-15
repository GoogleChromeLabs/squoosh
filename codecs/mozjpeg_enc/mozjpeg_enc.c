#include "emscripten.h"
#include <stdlib.h>
#include <inttypes.h>
#include <stdio.h>
#include <setjmp.h>
#include <string.h>
#include "jpeglib.h"
#include "config.h"

// MozJPEG doesn’t expose a numeric version, so I have to do some fun C macro hackery to turn it into a string. More details here: https://gcc.gnu.org/onlinedocs/cpp/Stringizing.html
#define xstr(s) str(s)
#define str(s) #s

EMSCRIPTEN_KEEPALIVE
int version() {
  char buffer[] = xstr(MOZJPEG_VERSION);
  int version = 0;
  int last_index = 0;
  for(int i = 0; i < strlen(buffer); i++) {
    if(buffer[i] == '.') {
      buffer[i] = '\0';
      version = version << 8 | atoi(&buffer[last_index]);
      buffer[i] = '.';
      last_index = i + 1;
    }
  }
  version = version << 8 | atoi(&buffer[last_index]);
  return version;
}

EMSCRIPTEN_KEEPALIVE
uint8_t* create_buffer(int width, int height) {
  return malloc(width * height * 4 * sizeof(uint8_t));
}

EMSCRIPTEN_KEEPALIVE
void destroy_buffer(uint8_t* p) {
  free(p);
}

int result[2];
EMSCRIPTEN_KEEPALIVE
void encode(uint8_t* image_buffer, int image_width, int image_height, int quality) {
  // Manually convert RGBA data into RGB
  for(int y = 0; y < image_height; y++) {
    for(int x = 0; x < image_width; x++) {
      image_buffer[(y*image_width + x)*3 + 0] = image_buffer[(y*image_width + x)*4 + 0];
      image_buffer[(y*image_width + x)*3 + 1] = image_buffer[(y*image_width + x)*4 + 1];
      image_buffer[(y*image_width + x)*3 + 2] = image_buffer[(y*image_width + x)*4 + 2];
    }
  }

  // The code below is basically the `write_JPEG_file` function from
  // https://github.com/mozilla/mozjpeg/blob/master/example.c
  // I just write to memory instead of a file.


  /* This struct contains the JPEG compression parameters and pointers to
   * working space (which is allocated as needed by the JPEG library).
   * It is possible to have several such structures, representing multiple
   * compression/decompression processes, in existence at once.  We refer
   * to any one struct (and its associated working data) as a "JPEG object".
   */
  struct jpeg_compress_struct cinfo;
  /* This struct represents a JPEG error handler.  It is declared separately
   * because applications often want to supply a specialized error handler
   * (see the second half of this file for an example).  But here we just
   * take the easy way out and use the standard error handler, which will
   * print a message on stderr and call exit() if compression fails.
   * Note that this struct must live as long as the main JPEG parameter
   * struct, to avoid dangling-pointer problems.
   */
  struct jpeg_error_mgr jerr;
  /* More stuff */
  JSAMPROW row_pointer[1];      /* pointer to JSAMPLE row[s] */
  int row_stride;               /* physical row width in image buffer */
  uint8_t* output;
  unsigned long size;

  /* Step 1: allocate and initialize JPEG compression object */

  /* We have to set up the error handler first, in case the initialization
   * step fails.  (Unlikely, but it could happen if you are out of memory.)
   * This routine fills in the contents of struct jerr, and returns jerr's
   * address which we place into the link field in cinfo.
   */
  cinfo.err = jpeg_std_error(&jerr);
  /* Now we can initialize the JPEG compression object. */
  jpeg_create_compress(&cinfo);

  /* Step 2: specify data destination (eg, a file) */
  /* Note: steps 2 and 3 can be done in either order. */

  /* Here we use the library-supplied code to send compressed data to a
   * stdio stream.  You can also write your own code to do something else.
   * VERY IMPORTANT: use "b" option to fopen() if you are on a machine that
   * requires it in order to write binary files.
   */
  // if ((outfile = fopen(filename, "wb")) == NULL) {
  //   fprintf(stderr, "can't open %s\n", filename);
  //   exit(1);
  // }
  jpeg_mem_dest(&cinfo, &output, &size);

  /* Step 3: set parameters for compression */

  /* First we supply a description of the input image.
   * Four fields of the cinfo struct must be filled in:
   */
  cinfo.image_width = image_width;      /* image width and height, in pixels */
  cinfo.image_height = image_height;
  cinfo.input_components = 3;           /* # of color components per pixel */
  cinfo.in_color_space = JCS_RGB;       /* colorspace of input image */
  /* Now use the library's routine to set default compression parameters.
   * (You must set at least cinfo.in_color_space before calling this,
   * since the defaults depend on the source color space.)
   */
  jpeg_set_defaults(&cinfo);
  /* Now you can set any non-default parameters you wish to.
   * Here we just illustrate the use of quality (quantization table) scaling:
   */
  jpeg_set_quality(&cinfo, quality, TRUE /* limit to baseline-JPEG values */);

  /* Step 4: Start compressor */

  /* TRUE ensures that we will write a complete interchange-JPEG file.
   * Pass TRUE unless you are very sure of what you're doing.
   */
  jpeg_start_compress(&cinfo, TRUE);

  /* Step 5: while (scan lines remain to be written) */
  /*           jpeg_write_scanlines(...); */

  /* Here we use the library's state variable cinfo.next_scanline as the
   * loop counter, so that we don't have to keep track ourselves.
   * To keep things simple, we pass one scanline per call; you can pass
   * more if you wish, though.
   */
  row_stride = image_width * 3; /* JSAMPLEs per row in image_buffer */

  while (cinfo.next_scanline < cinfo.image_height) {
    /* jpeg_write_scanlines expects an array of pointers to scanlines.
     * Here the array is only one element long, but you could pass
     * more than one scanline at a time if that's more convenient.
     */
    row_pointer[0] = & image_buffer[cinfo.next_scanline * row_stride];
    (void) jpeg_write_scanlines(&cinfo, row_pointer, 1);
  }

  /* Step 6: Finish compression */

  jpeg_finish_compress(&cinfo);
  /* Step 7: release JPEG compression object */

  result[0] = (int)output;
  result[1] = size;

  /* This is an important step since it will release a good deal of memory. */
  jpeg_destroy_compress(&cinfo);

  /* And we're done! */
}

EMSCRIPTEN_KEEPALIVE
void free_result(uint8_t* result) {
  free(result); // not sure if this is right with mozjpeg
}

EMSCRIPTEN_KEEPALIVE
int get_result_pointer() {
  return result[0];
}

EMSCRIPTEN_KEEPALIVE
int get_result_size() {
  return result[1];
}

