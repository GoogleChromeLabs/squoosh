#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <inttypes.h>
#include <string>
#include "basisu_global_selector_palette.h"
#include "basisu_transcoder.h"

using namespace emscripten;
using namespace basisu;

thread_local const val Uint8ClampedArray = val::global("Uint8ClampedArray");
thread_local const val ImageData = val::global("ImageData");

val decode(std::string data) {
  basist::basisu_transcoder_init();

  basist::etc1_global_selector_codebook sel_codebook = basist::etc1_global_selector_codebook(
      basist::g_global_selector_cb_size, basist::g_global_selector_cb);
  basist::ktx2_transcoder transcoder = basist::ktx2_transcoder(&sel_codebook);

  const void* dataPtr = reinterpret_cast<const void*>(data.c_str());
  auto dataSize = data.size();
  transcoder.init(dataPtr, dataSize);

  auto header = transcoder.get_header();
  auto image_width = static_cast<uint32_t>(header.m_pixel_width);
  auto image_height = static_cast<uint32_t>(header.m_pixel_height);

  transcoder.start_transcoding();
  auto buffer = std::vector<uint8_t>(image_width * image_height * 4);
  auto ok = transcoder.transcode_image_level(
      0 /* level_index */, 0 /* layer_index */, 0 /* face_index */, buffer.data(),
      buffer.size() / 4, basist::transcoder_texture_format::cTFRGBA32, 0 /* decode_flags */,
      image_width /* output_row_pitch_in_blocks_or_pixels */);
  if (!ok) {
    return val(std::string("Could not decode"));
  }

  auto img_data_data = Uint8ClampedArray.new_(typed_memory_view(buffer.size(), buffer.data()));
  auto imgData = ImageData.new_(img_data_data, image_width, image_height);
  return imgData;
}

EMSCRIPTEN_BINDINGS(my_module) {
  function("decode", &decode);
}
