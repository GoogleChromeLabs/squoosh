#include <emscripten/bind.h>
#include <emscripten/val.h>

#include "jxl/enc_file.h"

using namespace emscripten;

struct JXLOptions {
  // 1 = slowest
  // 7 = fastest
  int speed;
};

uint8_t *result;
val encode(std::string image, int width, int height, JXLOptions options) {
  jxl::CompressParams cparams;
  jxl::PassesEncoderState passes_enc_state;
  jxl::CodecInOut io;
  jxl::PaddedBytes bytes;
  jxl::ImageBundle *main = &io.Main();

  cparams.speed_tier = static_cast<jxl::SpeedTier>(options.speed);
  cparams.color_transform = jxl::ColorTransform::kNone;

  uint8_t *inBuffer = (uint8_t *)image.c_str();

  auto result = main->SetFromSRGB(
      width, height, false, true, true, (uint8_t *)image.c_str(),
      (uint8_t *)image.c_str() + width * height * 4);

  if (!result) {
    return val::null();
  }

  if (!EncodeFile(cparams, &io, &passes_enc_state, &bytes)) {
    return val::null();
  }

  return val(typed_memory_view(bytes.size(), bytes.data()));
}

void free_result() { delete result; }

EMSCRIPTEN_BINDINGS(my_module) {
    value_object<JXLOptions>("JXLOptions")
    .field("speed", &JXLOptions::speed);

  function("encode", &encode);
  function("free_result", &free_result);
}
