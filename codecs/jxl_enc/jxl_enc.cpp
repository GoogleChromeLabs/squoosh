#include <emscripten/bind.h>
#include <emscripten/val.h>

#include "jxl/enc_file.h"

using namespace emscripten;

uint8_t *result;
val encode(std::string image, int width, int height) {
  jxl::CompressParams cparams;
  jxl::PassesEncoderState passes_enc_state;
  // jxl::ThreadPool pool;
  jxl::CodecInOut io;
  jxl::PaddedBytes bytes;

  cparams.speed_tier = jxl::SpeedTier::kFalcon;

  jxl::ImageBundle *main = &io.Main();

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
  function("encode", &encode);
  function("free_result", &free_result);
}
