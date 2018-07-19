#include "emscripten.h"
#include "src/webp/encode.h"
#include <stdlib.h>
#include <emscripten/bind.h>

using namespace emscripten;

int version() {
  return WebPGetEncoderVersion();
}

int create_buffer(int width, int height) {
  return (int) malloc(width * height * 4 * sizeof(uint8_t));
}

void destroy_buffer(int p) {
  free((uint8_t*) p);
}

int result[2];
void encode(int img_in, int width, int height, WebPConfig config) {
  // A lot of this is duplicated from Encode in picture_enc.c
  WebPPicture pic;
  WebPMemoryWriter wrt;
  int ok;

  if (!WebPPictureInit(&pic)) {
    return;  // shouldn't happen, except if system installation is broken
  }

  pic.use_argb = !!config.lossless;
  pic.width = width;
  pic.height = height;
  pic.writer = WebPMemoryWrite;
  pic.custom_ptr = &wrt;

  WebPMemoryWriterInit(&wrt);

  ok = WebPPictureImportRGBA(&pic, (uint8_t*) img_in, width * 4) && WebPEncode(&config, &pic);
  WebPPictureFree(&pic);
  if (!ok) {
    WebPMemoryWriterClear(&wrt);
    return;
  }
  result[0] = (int)wrt.mem;
  result[1] = wrt.size;
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

EMSCRIPTEN_BINDINGS(my_module) {
  value_object<WebPConfig>("WebPConfig")
    .field("lossless", &WebPConfig::lossless)
    .field("quality", &WebPConfig::quality)
    .field("method", &WebPConfig::method)
    //.field("image_hint", &WebPConfig::image_hint)
    .field("target_size", &WebPConfig::target_size)
    .field("target_PSNR", &WebPConfig::target_PSNR)
    .field("segments", &WebPConfig::segments)
    .field("sns_strength", &WebPConfig::sns_strength)
    .field("filter_strength", &WebPConfig::filter_strength)
    .field("filter_sharpness", &WebPConfig::filter_sharpness)
    .field("filter_type", &WebPConfig::filter_type)
    .field("autofilter", &WebPConfig::autofilter)
    .field("alpha_compression", &WebPConfig::alpha_compression)
    .field("alpha_filtering", &WebPConfig::alpha_filtering)
    .field("alpha_quality", &WebPConfig::alpha_quality)
    .field("pass", &WebPConfig::pass)
    .field("show_compressed", &WebPConfig::show_compressed)
    .field("preprocessing", &WebPConfig::preprocessing)
    .field("partitions", &WebPConfig::partitions)
    .field("partition_limit", &WebPConfig::partition_limit)
    .field("emulate_jpeg_size", &WebPConfig::emulate_jpeg_size)
    .field("thread_level", &WebPConfig::thread_level)
    .field("low_memory", &WebPConfig::low_memory)
    .field("near_lossless", &WebPConfig::near_lossless)
    .field("exact", &WebPConfig::exact)
    .field("use_delta_palette", &WebPConfig::use_delta_palette)
    .field("use_sharp_yuv", &WebPConfig::use_sharp_yuv)
    //.field("pad", &WebPConfig::pad)
    ;

  function("version", &version);
  function("create_buffer", &create_buffer, allow_raw_pointers());
  function("destroy_buffer", &destroy_buffer, allow_raw_pointers());
  function("encode", &encode, allow_raw_pointers());
  function("free_result", &free_result);
  function("get_result_pointer", &get_result_pointer, allow_raw_pointers());
  function("get_result_size", &get_result_size, allow_raw_pointers());
}
