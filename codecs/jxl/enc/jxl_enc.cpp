#include <emscripten/bind.h>
#include <emscripten/val.h>

#include "lib/jxl/base/thread_pool_internal.h"
#include "lib/jxl/enc_external_image.h"
#include "lib/jxl/enc_file.h"
#include "lib/jxl/enc_color_management.h"

using namespace emscripten;

thread_local const val Uint8Array = val::global("Uint8Array");

struct JXLOptions {
  int effort;
  float quality;
  bool progressive;
  int epf;
  bool lossyPalette;
  size_t decodingSpeedTier;
  float photonNoiseIso;
  bool lossyModular;
};

val encode(std::string image, int width, int height, JXLOptions options) {
  jxl::CompressParams cparams;
  jxl::PassesEncoderState passes_enc_state;
  jxl::CodecInOut io;
  jxl::PaddedBytes bytes;
  jxl::ImageBundle* main = &io.Main();
  jxl::ThreadPoolInternal* pool_ptr = nullptr;
#ifdef __EMSCRIPTEN_PTHREADS__
  jxl::ThreadPoolInternal pool;
  pool_ptr = &pool;
#endif

  size_t st = 10 - options.effort;
  cparams.speed_tier = jxl::SpeedTier(st);

  cparams.epf = options.epf;
  cparams.decoding_speed_tier = options.decodingSpeedTier;
  cparams.photon_noise_iso = options.photonNoiseIso;

  if (options.lossyPalette) {
    cparams.lossy_palette = true;
    cparams.palette_colors = 0;
    cparams.options.predictor = jxl::Predictor::Zero;
    // Near-lossless assumes -R 0
    cparams.responsive = 0;
    cparams.modular_mode = true;
  }

  float quality = options.quality;

  // Quality settings roughly match libjpeg qualities.
  if (options.lossyModular || quality == 100) {
    cparams.modular_mode = true;
    // Internal modular quality to roughly match VarDCT size.
    if (quality < 7) {
      cparams.quality_pair.first = cparams.quality_pair.second =
          std::min(35 + (quality - 7) * 3.0f, 100.0f);
    } else {
      cparams.quality_pair.first = cparams.quality_pair.second =
          std::min(35 + (quality - 7) * 65.f / 93.f, 100.0f);
    }
  } else {
    cparams.modular_mode = false;
    if (quality >= 30) {
      cparams.butteraugli_distance = 0.1 + (100 - quality) * 0.09;
    } else {
      cparams.butteraugli_distance = 6.4 + pow(2.5, (30 - quality) / 5.0f) / 6.25f;
    }
  }

  if (options.progressive) {
    cparams.qprogressive_mode = true;
    cparams.responsive = 1;
    if (!cparams.modular_mode) {
      cparams.progressive_dc = 1;
    }
  }

  if (cparams.modular_mode) {
    if (cparams.quality_pair.first != 100 || cparams.quality_pair.second != 100) {
      cparams.color_transform = jxl::ColorTransform::kXYB;
    } else {
      cparams.color_transform = jxl::ColorTransform::kNone;
    }
  }

  io.metadata.m.SetAlphaBits(8);
  if (!io.metadata.size.Set(width, height)) {
    return val::null();
  }

  uint8_t* inBuffer = (uint8_t*)image.c_str();

  auto result = jxl::ConvertFromExternal(
      jxl::Span<const uint8_t>(reinterpret_cast<const uint8_t*>(image.data()), image.size()), width,
      height, jxl::ColorEncoding::SRGB(/*is_gray=*/false), /*has_alpha=*/true,
      /*alpha_is_premultiplied=*/false, /*bits_per_sample=*/8, /*endiannes=*/JXL_LITTLE_ENDIAN,
      /*flipped_y=*/false, pool_ptr, main, /*(only true if bits_per_sample==32) float_in=*/false);

  if (!result) {
    return val::null();
  }

  auto js_result = val::null();
  if (EncodeFile(cparams, &io, &passes_enc_state, &bytes, jxl::GetJxlCms(), /*aux=*/nullptr, pool_ptr)) {
    js_result = Uint8Array.new_(typed_memory_view(bytes.size(), bytes.data()));
  }

  return js_result;
}

EMSCRIPTEN_BINDINGS(my_module) {
  value_object<JXLOptions>("JXLOptions")
      .field("effort", &JXLOptions::effort)
      .field("quality", &JXLOptions::quality)
      .field("progressive", &JXLOptions::progressive)
      .field("lossyPalette", &JXLOptions::lossyPalette)
      .field("decodingSpeedTier", &JXLOptions::decodingSpeedTier)
      .field("photonNoiseIso", &JXLOptions::photonNoiseIso)
      .field("lossyModular", &JXLOptions::lossyModular)
      .field("epf", &JXLOptions::epf);

  function("encode", &encode);
}
