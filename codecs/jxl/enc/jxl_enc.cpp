#include <emscripten/bind.h>
#include <emscripten/val.h>

#include "lib/jxl/enc_file.h"
#include "lib/jxl/external_image.h"

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

  io.metadata.SetAlphaBits(8);

  uint8_t* inBuffer = (uint8_t*)image.c_str();

  auto result = jxl::ConvertImage(
      jxl::Span<const uint8_t>(reinterpret_cast<const uint8_t*>(image.data()), image.size()), width,
      height, jxl::ColorEncoding::SRGB(/*is_gray=*/false), /*has_alpha=*/true,
      /*alpha_is_premultiplied=*/false, /*bits_per_alpha=*/8, /*bits_per_sample=*/8,
      /*big_endian=*/false, /*flipped_y=*/false, /*pool=*/nullptr, main);

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

EMSCRIPTEN_BINDINGS(my_module) {
  value_object<JXLOptions>("JXLOptions")
      .field("speed", &JXLOptions::speed)
      .field("quality", &JXLOptions::quality);

  function("encode", &encode);
}
