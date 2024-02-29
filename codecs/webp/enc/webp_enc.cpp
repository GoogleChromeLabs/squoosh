#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <stdlib.h>
#include <string.h>
#include <stdexcept>
#include "src/webp/encode.h"

using namespace emscripten;

int version() {
  return WebPGetEncoderVersion();
}

thread_local const val Uint8Array = val::global("Uint8Array");

val encode(std::string img, int width, int height, WebPConfig config) {
  auto img_in = (uint8_t*)img.c_str();

  // A lot of this is duplicated from Encode in picture_enc.c
  WebPPicture pic;
  WebPMemoryWriter wrt;
  int ok;

  if (!WebPPictureInit(&pic)) {
    // shouldn't happen, except if system installation is broken
    return val::null();
  }

  // Allow quality to go higher than 0.
  config.qmax = 100;

  // Only use use_argb if we really need it, as it's slower.
  pic.use_argb = config.lossless || config.use_sharp_yuv || config.preprocessing > 0;
  pic.width = width;
  pic.height = height;
  pic.writer = WebPMemoryWrite;
  pic.custom_ptr = &wrt;

  WebPMemoryWriterInit(&wrt);

  ok = WebPPictureImportRGBA(&pic, img_in, width * 4) && WebPEncode(&config, &pic);
  WebPPictureFree(&pic);
  val js_result = ok ? Uint8Array.new_(typed_memory_view(wrt.size, wrt.mem)) : val::null();
  WebPMemoryWriterClear(&wrt);
  return js_result;
}

EMSCRIPTEN_BINDINGS(my_module) {
  enum_<WebPImageHint>("WebPImageHint")
      .value("WEBP_HINT_DEFAULT", WebPImageHint::WEBP_HINT_DEFAULT)
      .value("WEBP_HINT_PICTURE", WebPImageHint::WEBP_HINT_PICTURE)
      .value("WEBP_HINT_PHOTO", WebPImageHint::WEBP_HINT_PHOTO)
      .value("WEBP_HINT_GRAPH", WebPImageHint::WEBP_HINT_GRAPH);

  value_object<WebPConfig>("WebPConfig")
      .field("lossless", &WebPConfig::lossless)
      .field("quality", &WebPConfig::quality)
      .field("method", &WebPConfig::method)
      .field("image_hint", &WebPConfig::image_hint)
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
      .field("low_memory", &WebPConfig::low_memory)
      .field("near_lossless", &WebPConfig::near_lossless)
      .field("exact", &WebPConfig::exact)
      .field("use_delta_palette", &WebPConfig::use_delta_palette)
      .field("use_sharp_yuv", &WebPConfig::use_sharp_yuv);

  function("version", &version);
  function("encode", &encode);
}
