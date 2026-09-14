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

  // NB: this binds libwebp's WebPConfig directly, and deliberately does NOT
  // expose every field. WebPConfigInit() is never called - embind
  // value-initialises the struct and then fills in the bound fields from JS - so
  // any field left unbound is zero, which is exactly what WebPConfigInit sets
  // for all of them (see src/enc/config_enc.c). Unbound on purpose:
  //   target_size / target_PSNR  - alternative rate control, conflicts with the
  //                                quality slider
  //   partition_limit            - VP8 partition sizing, no effect
  //   show_compressed            - debug only
  //   emulate_jpeg_size          - only meaningful with target_size
  //   low_memory                 - trades speed for memory; not worth exposing
  //   use_delta_palette          - upstream-documented as experimental/no-op
  value_object<WebPConfig>("WebPConfig")
      .field("lossless", &WebPConfig::lossless)
      .field("quality", &WebPConfig::quality)
      .field("method", &WebPConfig::method)
      .field("image_hint", &WebPConfig::image_hint)
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
      .field("preprocessing", &WebPConfig::preprocessing)
      .field("partitions", &WebPConfig::partitions)
      .field("near_lossless", &WebPConfig::near_lossless)
      .field("exact", &WebPConfig::exact)
      .field("use_sharp_yuv", &WebPConfig::use_sharp_yuv)
      // Enables libwebp's single side worker (alpha encoding, split analysis,
      // parallel lossless crunch-config search). This was in EncodeOptions and
      // defaultOptions but never actually bound here, so it had no effect at
      // all before - and the build had threads disabled anyway.
      .field("thread_level", &WebPConfig::thread_level);

  function("version", &version);
  function("encode", &encode);
}
