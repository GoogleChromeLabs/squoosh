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
  basist::basisu_transcoder transcoder = basist::basisu_transcoder(&sel_codebook);

  const void* dataPtr = reinterpret_cast<const void*>(data.c_str());
  auto dataSize = data.size();
  basist::basisu_image_info info;
  transcoder.get_image_info(dataPtr, dataSize, info, 0 /* image_index */);

  transcoder.start_transcoding(dataPtr, dataSize);
  auto buffer = std::vector<uint8_t>(info.m_width * info.m_height * 4);
  auto ok = transcoder.transcode_image_level(dataPtr, dataSize,
                                             /* image_index */ 0, /* level_index */ 0,
                                             buffer.data(), buffer.size() / 4,
                                             basist::transcoder_texture_format::cTFRGBA32);
  if (!ok) {
    return val(std::string("Could not decode"));
  }

  auto img_data_data = Uint8ClampedArray.new_(typed_memory_view(buffer.size(), buffer.data()));
  auto imgData = ImageData.new_(img_data_data, info.m_width, info.m_height);
  return imgData;
}

EMSCRIPTEN_BINDINGS(my_module) {
  function("decode", &decode);
}
