#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <setjmp.h>
#include <stdio.h>
#include <stdlib.h>

#include <string>

#include "lib/jpegli/encode.h"

using namespace emscripten;

// Mirrors JpegliChromaSubsample in jpegli_enc.d.ts. The order MUST match.
enum ChromaSubsample {
  k444 = 0,
  k422,
  k440,
  k420,
};

struct JpegliOptions {
  // libjpeg-style quality 1..100, remapped to a butteraugli distance, exactly
  // as cjpegli's --quality does.
  int quality;
  // 0 = sequential (baseline), higher = more progressive scans. Range 0..2.
  int progressive_level;
  // One of the ChromaSubsample values above.
  int chroma_subsampling;
};

thread_local const val Uint8Array = val::global("Uint8Array");

struct ErrorManager {
  jpeg_error_mgr mgr;
  jmp_buf setjmp_buffer;
};

static void ErrorExit(j_common_ptr cinfo) {
  ErrorManager* err = reinterpret_cast<ErrorManager*>(cinfo->err);
  longjmp(err->setjmp_buffer, 1);
}

val encode(std::string image_in,
           int image_width,
           int image_height,
           JpegliOptions opts) {
  uint8_t* image_buffer = (uint8_t*)image_in.c_str();

  jpeg_compress_struct cinfo;
  ErrorManager err;
  uint8_t* output = nullptr;
  unsigned long size = 0;

  cinfo.err = jpegli_std_error(&err.mgr);
  err.mgr.error_exit = &ErrorExit;
  if (setjmp(err.setjmp_buffer)) {
    // jpegli signalled a fatal error.
    jpegli_destroy_compress(&cinfo);
    if (output) free(output);
    return val::null();
  }

  jpegli_create_compress(&cinfo);
  jpegli_mem_dest(&cinfo, &output, &size);

  cinfo.image_width = image_width;
  cinfo.image_height = image_height;
  // Input is RGBA from an ImageData; jpegli (via libjpeg-turbo's jpeglib.h)
  // accepts the JCS_EXT_RGBA extension colorspace and drops the alpha channel.
  cinfo.input_components = 4;
  cinfo.in_color_space = JCS_EXT_RGBA;

  jpegli_set_defaults(&cinfo);

  // Chroma subsampling, applied the same way as cjpegli (lib/extras/enc/jpegli.cc):
  // set the luma component's sampling factors and force chroma to 1x1.
  switch (opts.chroma_subsampling) {
    case k444:
      cinfo.comp_info[0].h_samp_factor = 1;
      cinfo.comp_info[0].v_samp_factor = 1;
      break;
    case k440:
      cinfo.comp_info[0].h_samp_factor = 1;
      cinfo.comp_info[0].v_samp_factor = 2;
      break;
    case k422:
      cinfo.comp_info[0].h_samp_factor = 2;
      cinfo.comp_info[0].v_samp_factor = 1;
      break;
    case k420:
    default:
      cinfo.comp_info[0].h_samp_factor = 2;
      cinfo.comp_info[0].v_samp_factor = 2;
      break;
  }
  for (int i = 1; i < cinfo.num_components; ++i) {
    cinfo.comp_info[i].h_samp_factor = 1;
    cinfo.comp_info[i].v_samp_factor = 1;
  }

  // Quality -> butteraugli distance, as cjpegli's --quality does.
  jpegli_set_distance(&cinfo, jpegli_quality_to_distance(opts.quality), TRUE);

  jpegli_set_progressive_level(&cinfo, opts.progressive_level);

  jpegli_start_compress(&cinfo, TRUE);

  int row_stride = image_width * 4;
  while (cinfo.next_scanline < cinfo.image_height) {
    JSAMPROW row_pointer = &image_buffer[cinfo.next_scanline * row_stride];
    jpegli_write_scanlines(&cinfo, &row_pointer, 1);
  }

  jpegli_finish_compress(&cinfo);

  auto js_result = Uint8Array.new_(typed_memory_view(size, output));

  jpegli_destroy_compress(&cinfo);
  free(output);

  return js_result;
}

EMSCRIPTEN_BINDINGS(my_module) {
  value_object<JpegliOptions>("JpegliOptions")
      .field("quality", &JpegliOptions::quality)
      .field("progressiveLevel", &JpegliOptions::progressive_level)
      .field("chromaSubsampling", &JpegliOptions::chroma_subsampling);

  function("encode", &encode);
}
