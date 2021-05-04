#include <stdint.h>
#include <string>

#include "config.h"
#include "jpeglib.h"

extern "C" {
#include "cdjpeg.h"
}

struct MozJpegOptions {
  int quality;
  bool baseline;
  bool arithmetic;
  bool progressive;
  bool optimize_coding;
  int smoothing;
  int color_space;
  int quant_table;
  bool trellis_multipass;
  bool trellis_opt_zero;
  bool trellis_opt_table;
  int trellis_loops;
  bool auto_subsample;
  int chroma_subsample;
  bool separate_chroma_quality;
  int chroma_quality;
};

struct DynArray {
  size_t size;
  uint8_t* ptr;
};

__attribute__((export_name("encode"))) intptr_t* encode(uintptr_t* image_in,
                                                        int image_width,
                                                        int image_height) {
  uint8_t* image_buffer = reinterpret_cast<uint8_t*>(image_in);

  struct MozJpegOptions opts = {
      10,         // int quality;
      false,      // bool baseline;
      false,      // bool arithmetic;
      true,       // bool progressive;
      true,       // bool optimize_coding;
      0,          // int smoothing;
      JCS_YCbCr,  // int color_space;
      3,          // int quant_table;
      false,      // bool trellis_multipass;
      false,      // bool trellis_opt_zero;
      false,      // bool trellis_opt_table;
      1,          // int trellis_loops;
      true,       // bool auto_subsample;
      2,          // int chroma_subsample;
      false,      // bool separate_chroma_quality;
      75          // int chroma_quality;
  };

  // The code below is basically the `write_JPEG_file` function from
  // https://github.com/mozilla/mozjpeg/blob/master/example.c
  // I just write to memory instead of a file.

  /* Step 1: allocate and initialize JPEG compression object */

  /* This struct contains the JPEG compression parameters and pointers to
   * working space (which is allocated as needed by the JPEG library).
   * It is possible to have several such structures, representing multiple
   * compression/decompression processes, in existence at once.  We refer
   * to any one struct (and its associated working data) as a "JPEG object".
   */
  jpeg_compress_struct cinfo;
  /* This struct represents a JPEG error handler.  It is declared separately
   * because applications often want to supply a specialized error handler
   * (see the second half of this file for an example).  But here we just
   * take the easy way out and use the standard error handler, which will
   * print a message on stderr and call exit() if compression fails.
   * Note that this struct must live as long as the main JPEG parameter
   * struct, to avoid dangling-pointer problems.
   */
  jpeg_error_mgr jerr;
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
  uint8_t* output = nullptr;
  unsigned long size = 0;
  jpeg_mem_dest(&cinfo, &output, &size);

  /* Step 3: set parameters for compression */

  /* First we supply a description of the input image.
   * Four fields of the cinfo struct must be filled in:
   */
  cinfo.image_width = image_width; /* image width and height, in pixels */
  cinfo.image_height = image_height;
  cinfo.input_components = 4;          /* # of color components per pixel */
  cinfo.in_color_space = JCS_EXT_RGBA; /* colorspace of input image */
  /* Now use the library's routine to set default compression parameters.
   * (You must set at least cinfo.in_color_space before calling this,
   * since the defaults depend on the source color space.)
   */
  jpeg_set_defaults(&cinfo);

  jpeg_set_colorspace(&cinfo, (J_COLOR_SPACE)opts.color_space);

  if (opts.quant_table != -1) {
    jpeg_c_set_int_param(&cinfo, JINT_BASE_QUANT_TBL_IDX, opts.quant_table);
  }

  cinfo.optimize_coding = opts.optimize_coding;

  if (opts.arithmetic) {
    cinfo.arith_code = TRUE;
    cinfo.optimize_coding = FALSE;
  }

  cinfo.smoothing_factor = opts.smoothing;

  jpeg_c_set_bool_param(&cinfo, JBOOLEAN_USE_SCANS_IN_TRELLIS, opts.trellis_multipass);
  jpeg_c_set_bool_param(&cinfo, JBOOLEAN_TRELLIS_EOB_OPT, opts.trellis_opt_zero);
  jpeg_c_set_bool_param(&cinfo, JBOOLEAN_TRELLIS_Q_OPT, opts.trellis_opt_table);
  jpeg_c_set_int_param(&cinfo, JINT_TRELLIS_NUM_LOOPS, opts.trellis_loops);

  // A little hacky to build a string for this, but it means we can use
  // set_quality_ratings which does some useful heuristic stuff.
  std::string quality_str = std::to_string(opts.quality);

  if (opts.separate_chroma_quality && opts.color_space == JCS_YCbCr) {
    quality_str += "," + std::to_string(opts.chroma_quality);
  }

  char const* pqual = quality_str.c_str();

  set_quality_ratings(&cinfo, (char*)pqual, opts.baseline);

  if (!opts.auto_subsample && opts.color_space == JCS_YCbCr) {
    cinfo.comp_info[0].h_samp_factor = opts.chroma_subsample;
    cinfo.comp_info[0].v_samp_factor = opts.chroma_subsample;
  }

  if (!opts.baseline && opts.progressive) {
    jpeg_simple_progression(&cinfo);
  } else {
    cinfo.num_scans = 0;
    cinfo.scan_info = NULL;
  }
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
  int row_stride = image_width * 4; /* JSAMPLEs per row in image_buffer */

  while (cinfo.next_scanline < cinfo.image_height) {
    /* jpeg_write_scanlines expects an array of pointers to scanlines.
     * Here the array is only one element long, but you could pass
     * more than one scanline at a time if that's more convenient.
     */

    JSAMPROW row_pointer =
        &image_buffer[cinfo.next_scanline * row_stride]; /* pointer to JSAMPLE row[s] */
    (void)jpeg_write_scanlines(&cinfo, &row_pointer, 1);
  }

  /* Step 6: Finish compression */

  jpeg_finish_compress(&cinfo);

  /* Step 7: release JPEG compression object */

  /* This is an important step since it will release a good deal of memory. */
  jpeg_destroy_compress(&cinfo);

  /* And we're done! */
  auto result = new DynArray();
  result->size = size;
  result->ptr = output;
  return reinterpret_cast<intptr_t*>(result);
}

__attribute__((export_name("alloc"))) uintptr_t* alloc(size_t size) {
  return reinterpret_cast<uintptr_t*>(malloc(size));
}

__attribute__((export_name("dealloc"))) void dealloc(uintptr_t* ptr) {
  return free(ptr);
}

int main() {
  return 0;
}