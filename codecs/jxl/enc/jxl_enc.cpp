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
  bool progressive;
  int epf;
  int nearLossless;
};

val encode(std::string image, int width, int height, JXLOptions options) {
  jxl::CompressParams cparams;
  jxl::PassesEncoderState passes_enc_state;
  jxl::CodecInOut io;
  jxl::PaddedBytes bytes;
  jxl::ImageBundle* main = &io.Main();

  cparams.epf = options.epf;
  cparams.speed_tier = static_cast<jxl::SpeedTier>(options.speed);
  cparams.near_lossless = options.nearLossless;

  float quality = options.quality;

  // Quality settings roughly match libjpeg qualities.
  if (quality < 7 || quality == 100) {
    cparams.modular_mode = true;
    // Internal modular quality to roughly match VarDCT size.
    cparams.quality_pair.first = cparams.quality_pair.second =
        std::min(35 + (quality - 7) * 3.0f, 100.0f);
  } else {
    if (quality >= 30) {
      cparams.butteraugli_distance = 0.1 + (100 - quality) * 0.09;
    } else {
      cparams.butteraugli_distance = 6.4 + pow(2.5, (30 - quality) / 5.0f) / 6.25f;
    }
  }

  if (options.progressive) {
    cparams.qprogressive_mode = true;
    cparams.progressive_dc = 1;
    cparams.responsive = 1;
  }

  if (cparams.modular_mode) {
    if (cparams.quality_pair.first != 100 || cparams.quality_pair.second != 100) {
      cparams.color_transform = jxl::ColorTransform::kXYB;
    } else {
      cparams.color_transform = jxl::ColorTransform::kNone;
    }
  }

  if (cparams.near_lossless) {
    // Near-lossless assumes -R 0
    cparams.responsive = 0;
  }

  io.metadata.m.SetAlphaBits(8);

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

  return js_result;
}

EMSCRIPTEN_BINDINGS(my_module) {
  value_object<JXLOptions>("JXLOptions")
      .field("speed", &JXLOptions::speed)
      .field("quality", &JXLOptions::quality)
      .field("progressive", &JXLOptions::progressive)
      .field("nearLossless", &JXLOptions::nearLossless)
      .field("epf", &JXLOptions::epf);

  function("encode", &encode);
}
