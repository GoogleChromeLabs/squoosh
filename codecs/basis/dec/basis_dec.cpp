#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <inttypes.h>
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
  // basis_data data = basis_data(sel_codebook);
  basist::basisu_transcoder transcoder = basist::basisu_transcoder(&sel_codebook);

  const void* dataPtr = reinterpret_cast<const void*>(data.c_str());
  auto dataSize = data.size();
  basist::basisu_image_info info;
  transcoder.get_image_info(dataPtr, dataSize, info, 0 /* image_index */);

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
  // value_object<MozJpegOptions>("MozJpegOptions")
  //     .field("quality", &MozJpegOptions::quality)
  //     .field("baseline", &MozJpegOptions::baseline)
  //     .field("arithmetic", &MozJpegOptions::arithmetic)
  //     .field("progressive", &MozJpegOptions::progressive)
  //     .field("optimize_coding", &MozJpegOptions::optimize_coding)
  //     .field("smoothing", &MozJpegOptions::smoothing)
  //     .field("color_space", &MozJpegOptions::color_space)
  //     .field("quant_table", &MozJpegOptions::quant_table)
  //     .field("trellis_multipass", &MozJpegOptions::trellis_multipass)
  //     .field("trellis_opt_zero", &MozJpegOptions::trellis_opt_zero)
  //     .field("trellis_opt_table", &MozJpegOptions::trellis_opt_table)
  //     .field("trellis_loops", &MozJpegOptions::trellis_loops)
  //     .field("chroma_subsample", &MozJpegOptions::chroma_subsample)
  //     .field("auto_subsample", &MozJpegOptions::auto_subsample)
  //     .field("separate_chroma_quality", &MozJpegOptions::separate_chroma_quality)
  //     .field("chroma_quality", &MozJpegOptions::chroma_quality);

  function("decode", &decode);
}
