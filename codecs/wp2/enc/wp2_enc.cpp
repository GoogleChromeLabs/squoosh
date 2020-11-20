#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <cstdio>
#include "src/wp2/encode.h"

using namespace emscripten;

thread_local const val Uint8Array = val::global("Uint8Array");

struct WP2Options {
  float quality;
  float alpha_quality;
  int speed;
  int pass;
  int uv_mode;
  float sns;
};

val encode(std::string image_in, int image_width, int image_height, WP2Options options) {
  WP2::EncoderConfig config = {};

  config.quality = options.quality;
  config.alpha_quality = options.alpha_quality;
  config.speed = options.speed;
  config.pass = options.pass;
  config.uv_mode = static_cast<WP2::EncoderConfig::UVMode>(options.uv_mode);
  config.sns = options.sns;

  uint8_t* image_buffer = (uint8_t*)image_in.c_str();
  WP2::ArgbBuffer src = WP2::ArgbBuffer();
  WP2Status status =
      src.Import(WP2_rgbA_32,  // Format. WP2_RGBA_32 is the same but NOT premultiplied alpha
                 image_width, image_height, image_buffer, 4 * image_width);
  if (status != WP2_STATUS_OK) {
    return val::null();
  }

  WP2::MemoryWriter memory_writer;
  status = WP2::Encode(src, &memory_writer, config);
  if (status != WP2_STATUS_OK) {
    return val::null();
  }

  return Uint8Array.new_(typed_memory_view(memory_writer.size_, memory_writer.mem_));
}

EMSCRIPTEN_BINDINGS(my_module) {
  value_object<WP2Options>("WP2Options")
      .field("quality", &WP2Options::quality)
      .field("alpha_quality", &WP2Options::alpha_quality)
      .field("speed", &WP2Options::speed)
      .field("pass", &WP2Options::pass)
      .field("uv_mode", &WP2Options::uv_mode)
      .field("sns", &WP2Options::sns);

  function("encode", &encode);
}
