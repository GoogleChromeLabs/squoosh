#include <cstdio>
#include <emscripten/bind.h>
#include <emscripten/val.h>

#include "src/wp2/encode.h"
using namespace emscripten;

val encode(std::string image_in, int image_width, int image_height,
           WP2::EncoderConfig config) {
  WP2Status status;
  uint8_t *image_buffer = (uint8_t *)image_in.c_str();
  WP2::ArgbBuffer src = WP2::ArgbBuffer();
  status = src.Import(WP2_rgbA_32, // Format. WP2_RGBA_32 is the same but NOT
                                   // premultiplied alpha
                      image_width, image_height, image_buffer, 4 * image_width);
  if (status != WP2_STATUS_OK) {
    return val::null();
  }

  WP2::MemoryWriter memory_writer;
  status = WP2::Encode(src, &memory_writer, config);
  if (status != WP2_STATUS_OK) {
    return val::null();
  }

  return val(typed_memory_view(memory_writer.size_, memory_writer.mem_));
  // Lol I forgot to add the free here.
}

EMSCRIPTEN_BINDINGS(my_module) {
  value_object<WP2::EncoderConfig>("WP2EncoderConfig")
      .field("quality", &WP2::EncoderConfig::quality)
      .field("alpha_quality", &WP2::EncoderConfig::alpha_quality)
      .field("speed", &WP2::EncoderConfig::speed)
      .field("pass", &WP2::EncoderConfig::pass)
      .field("sns", &WP2::EncoderConfig::sns);

  function("encode", &encode);
}
