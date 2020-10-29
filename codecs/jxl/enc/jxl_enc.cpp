#include <emscripten/bind.h>
#include <emscripten/val.h>

#include "jxl/enc_file.h"

using namespace emscripten;

thread_local const val Uint8Array = val::global("Uint8Array");

struct JXLOptions {
  // 1 = slowest
  // 7 = fastest
  int speed;
  float quality;
};

val encode(std::string image, int width, int height, JXLOptions options) {
  jxl::CompressParams cparams;
  jxl::PassesEncoderState passes_enc_state;
  jxl::CodecInOut io;
  jxl::PaddedBytes bytes;
  jxl::ImageBundle* main = &io.Main();

  cparams.speed_tier = static_cast<jxl::SpeedTier>(options.speed);
  cparams.butteraugli_distance = options.quality;
  // cparams.color_transform = jxl::ColorTransform::kNone;

  io.metadata.SetUintSamples(8);
  io.metadata.SetAlphaBits(8);
  // io.metadata.color_encoding = jxl::ColorEncoding::SRGB(false);

  uint8_t* inBuffer = (uint8_t*)image.c_str();

  auto result =
      main->SetFromSRGB(width, height, /*is_gray*/ false, /*has_alpha*/ true,
                        /*alpha_is_premultiplied*/ true, /*pixels*/ (uint8_t*)image.c_str(),
                        /* end */ (uint8_t*)image.c_str() + width * height * 4);

  if (!result) {
    return val::null();
  }

  auto js_result = val::null();
  if (EncodeFile(cparams, &io, &passes_enc_state, &bytes)) {
    js_result = Uint8Array.new_(typed_memory_view(bytes.size(), bytes.data()));
  }

  // TODO: Any freeing that needs to be done?
  //
  return js_result;
}

void free_result() {}

EMSCRIPTEN_BINDINGS(my_module) {
  value_object<JXLOptions>("JXLOptions")
      .field("speed", &JXLOptions::speed)
      .field("quality", &JXLOptions::quality);

  function("encode", &encode);
}
