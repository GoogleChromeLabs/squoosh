#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <inttypes.h>
#include "basisu_comp.h"
#include "basisu_enc.h"

using namespace emscripten;
using namespace basisu;

struct BasisOptions {
  uint8_t quality;
  uint8_t compression;
  bool uastc;
  bool mipmap;
};

thread_local const val Uint8Array = val::global("Uint8Array");

val encode(std::string image_in, int image_width, int image_height, BasisOptions opts) {
  basisu_encoder_init();

  basist::etc1_global_selector_codebook sel_codebook(basist::g_global_selector_cb_size,
                                                     basist::g_global_selector_cb);
  basis_compressor_params params;
  basis_compressor compressor;
  image img =
      image(reinterpret_cast<const uint8_t*>(image_in.c_str()), image_width, image_height, 4);
  // We don’t need the encoder to read/decode files from the filesystem
  params.m_read_source_images = false;
  // Writing is unnecessary, too
  params.m_write_output_basis_files = false;
  // No printf pls
  params.m_status_output = false;
  // True => UASTC, False => ETC1S
  params.m_uastc = opts.uastc;
  // Use the standardized KTX2 format
  params.m_create_ktx2_file = true;
  // Codebook, whatever this exactly is or does.
  params.m_pSel_codebook = &sel_codebook;
  // No multithreading. It apparently doesn’t work well in Wasm.
  // But we still need to provide a job pool.
  params.m_multithreading = false;
  job_pool jpool(1);
  params.m_pJob_pool = &jpool;

  // Needs to be exposed as an option
  params.m_ktx2_uastc_supercompression = basist::KTX2_SS_ZSTANDARD;

  params.m_mip_gen = opts.mipmap;
  params.m_mip_filter = "box";
  params.m_quality_level = opts.quality;
  params.m_compression_level = opts.compression;
  params.m_source_images.push_back(img);

  printf("%d\n", __LINE__);
  if (!compressor.init(params)) {
    return val(std::string("Well something went wrong during init"));
  }

  printf("%d\n", __LINE__);
  if (compressor.process() != 0) {
    return val(std::string("Well something went wrong during processing"));
  }

  printf("%d\n", __LINE__);
  auto comp_data = compressor.get_output_ktx2_file();
  auto js_result = Uint8Array.new_(typed_memory_view(comp_data.size(), &comp_data[0]));
  // Not sure if there is anything to free here
  return js_result;
}

EMSCRIPTEN_BINDINGS(my_module) {
  value_object<BasisOptions>("BasisOptions")
      .field("quality", &BasisOptions::quality)
      .field("compression", &BasisOptions::compression)
      .field("uastc", &BasisOptions::uastc)
      .field("mipmap", &BasisOptions::mipmap);

  function("encode", &encode);
}
