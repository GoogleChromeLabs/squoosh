#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <inttypes.h>
#include "basisu_comp.h"
#include "basisu_enc.h"

using namespace emscripten;
using namespace basisu;

thread_local const val Uint8Array = val::global("Uint8Array");

val encode(std::string image_in, int image_width, int image_height /*, MozJpegOptions opts*/) {
  basisu_encoder_init();

  basis_compressor_params params;
  basis_compressor compressor;
  image img =
      image(reinterpret_cast<const uint8_t*>(image_in.c_str()), image_width, image_height, 4);
  // We don’t need the encoder to read/decode files from the filesystem
  params.m_read_source_images = false;
  // Writing is unnecessary, too
  params.m_read_source_images = false;
  // Generate .basis file
  params.m_uastc = true;
  // No printf pls
  params.m_status_output = false;
  params.m_compression_level = 2; /* 0-4 */
  params.m_source_images.push_back(img);

  if (!compressor.init(params)) {
    return val(std::string("Well something went wrong during init"));
  }

  if (compressor.process() != 0) {
    return val(std::string("Well something went wrong during processing"));
  }

  auto comp_data = compressor.get_output_basis_file();
  auto js_result = Uint8Array.new_(typed_memory_view(comp_data.size(), &comp_data[0]));
  // Not sure if there is anything to free here
  return js_result;
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

  function("encode", &encode);
}
