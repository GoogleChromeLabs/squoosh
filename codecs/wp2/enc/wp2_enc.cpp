#include <cstdio>
#include <emscripten/bind.h>
#include <emscripten/val.h>

#include "src/wp2/encode.h"
using namespace emscripten;

// enum PartitionMethod {
//   // For each block size starting from biggest, take all blocks matching
//   some: THRESH_VARIANCE_PARTITIONING,  // uniform variance score
//   // For each block size starting from biggest, find the best pos depending
//   on: BIG_BLOCK_VARIANCE_RNG_PARTITIONING,  // uniform variance score
//   BIG_BLOCK_VARIANCE_MAX_PARTITIONING,  // low variance score
//   BIG_BLOCK_TRANS_AMPL_PARTITIONING,    // DCT coeffs amplitude
//   BIG_BLOCK_TRANS_ZEROS_PARTITIONING,   // number of near zeros in DCT coeffs
//   BIG_BLOCK_LUMA_RNG_PARTITIONING,      // luma range score
//   BIG_BLOCK_RECONS_PARTITIONING,        // reconstruction score
//   BIG_BLOCK_PRED_PARTITIONING,          // prediction score
//   BIG_BLOCK_QUANT_PARTITIONING,         // pred+recons+quant score
//   // For each pos starting from top left, take the best block size depending
//   on: TOP_LEFT_RECONS_PARTITIONING,              // reconstruction score
//   TOP_LEFT_PRED_PARTITIONING,                // prediction score
//   TOP_LEFT_BLOCK_ENCODE_PARTITIONING,        // block encoding score
//   TOP_LEFT_TILE_ENCODE_PARTITIONING,         // tile encoding score (slow)
//   TOP_LEFT_TILE_ENCODE_DECODE_PARTITIONING,  // tile enc+dec score (slow)
//   // Combine several metrics in successive block size passes:
//   MULTIPASS_PARTITIONING,
//   // For each possible block layout, take the best one (extremely slow):
//   EXHAUSTIVE_PARTITIONING,  // based on tile enc+dec score
//   // Split variants of methods above:
//   SPLIT_BIG_BLOCK_VARIANCE_MAX_PARTITIONING,
//   SPLIT_BIG_BLOCK_PRED_PARTITIONING,
//   SPLIT_BIG_BLOCK_QUANT_PARTITIONING,
//   SPLIT_TOP_LEFT_BLOCK_ENCODE_PARTITIONING,
//   // Fixed block size (except on edges). Also depends on the partition set.
//   ALL_4X4_PARTITIONING,
//   ALL_8X8_PARTITIONING,
//   ALL_16X16_PARTITIONING,
//   ALL_32X32_PARTITIONING,
//   NUM_PARTITION_METHODS
// };

// enum PartitionSet {  // The smallest block size is 4x4.
//   SMALL_SQUARES,     // Up to 8x8
//   SMALL_RECTS,       // Up to 16x16
//   ALL_RECTS,         // Up to 32x32, ratio at most 4:1
//   THICK_RECTS,       // Up to 32x32, ratio at most 2:1
//   MEDIUM_SQUARES,    // Up to 16x16
//   ALL_SQUARES,       // Up to 32x32
//   SOME_RECTS,        // Up to 32x32, subset of frequently used rects
//   NUM_PARTITION_SETS
// };

// enum class PredictorSet {
//   CUSTOM_PREDICTORS = 0,  // this predictor should stay first
//   DC_PREDICTORS,
//   ANGLE_PREDICTORS,
//   VP8_PREDICTORS,
//   SMOOTH_PREDICTORS,
//   PAETH_PREDICTOR,
//   AV1_FILTER,
//   FUSE_PREDICTORS,
//   ALL,               // includes all of the above starting at 1
//   LARGE_PREDICTORS,  // fixed set for some Y blocks
//   UV_PREDICTORS,     // fixed set for U/V
//   ALPHA_PREDICTORS,  // fixed set for alpha
//   LAST_PREDICTORS,   // end-of-list marker
// };

// enum class Csp { kYCoCg, kYCbCr, kCustom, kYIQ };

// typedef enum {
//   UVModeAdapt = 0,
//   UVMode420,
//   UVModeSharp,
//   UVMode444,
//   NumUVMode  // End-of-list marker
// } UVMode;

struct WP2Options {
  float quality = 75.0f; // Range: [0 = smallest file .. 100 = lossless]
                         // Quality in [95-100) range will use near-lossless.
                         // Quality 100 is strictly lossless.
  // int target_size = 0;   // If non-zero, set the desired target size in
  // bytes. Takes precedence over the 'quality' parameter.
  // float target_psnr = 0.f;  // If non-zero, specifies the minimal distortion
  // to try to achieve. Precedence over 'target_size'.

  float alpha_quality = 100.f; // Range: [0 = smallest size .. 100 = lossless]
  int speed = 5; // Quality/speed trade-off. Range: [0=fast .. 9=slower-better]

  // Side parameters:
  // Set whether the image will be rotated during decoding.
  // Orientation decoding_orientation = Orientation::kOriginal;
  // Add a heavily compressed preview to be decoded and displayed before final
  // pixels (small size overhead up to kMaxPreviewSize).
  // bool create_preview = false;

  // TransferFunction transfer_function = WP2_TF_ITU_R_BT2020_10BIT;

  // Parameters related to lossy compression only:
  int pass = 1; // Number of entropy-analysis passes. Range: [1..10]

  // Spatial noise shaping strength in [0(=off), 100]
  // Affects how we spread noise between 'risky' areas (where noise is easily
  // visible) and easier areas (where it's less visible). A high SNS
  // value leads to skewing noise more towards areas where it should be less
  // visible. In general this improves SSIM but worsens PSNR.
  float sns = 50.f;
  int error_diffusion = 0; // error diffusion strength [0=off, 100=max]

  int segments = 4; // Max number of segments. Range: [1..kMaxNumSegments]
  int segment_threshold = 0; // Segmentation threshold. Range: [0..100]
  // selector for explicit or implicit segment-id
  // typedef enum {
  //   SEGMENT_ID_AUTO,     // use ID_EXPLICIT above a quality threshold
  //   SEGMENT_ID_EXPLICIT,
  //   SEGMENT_ID_IMPLICIT
  // } SegmentIdMode;
  // SegmentIdMode segment_id_mode = SEGMENT_ID_AUTO;

  // Size of tiles (width/height) in pixels. Tiles are always square. Each
  // tile is compressed independently, possibly in parallel.
  // Valid values: 64, 128, 256, 512 (see format_constants.h)
  // 0 means size is chosen automatically.
  int tile_size = 0;

  // Algorithm for dividing the image into blocks.
  // PartitionMethod partition_method = MULTIPASS_PARTITIONING;
  // The set of allowed block sizes for image partitioning.
  // PartitionSet partition_set = SOME_RECTS;
  // If true, use binary space partitioning instead of floating partition.
  bool partition_snapping = true;

  // The set of predictors that can be used for reconstruction.
  // PredictorSet predictor_set = PredictorSet::VP8_PREDICTORS;

  WP2::Csp csp_type = WP2::Csp::kYCoCg; // Colorspace.

  WP2::EncoderConfig::UVMode uv_mode =
      WP2::EncoderConfig::UVMode::UVMode420; // Default sub-sampling mode for
                                             // U/V planes.

  // int preprocessing = 0;           // Preprocessing filter.
  // int preprocessing_strength = 0;  // Range: [0 .. 100]

  // bool use_random_matrix = false;  // Experimental.
  // bool store_grain = false;        // Experimental: store grain info

  // // Parameters related to lossless compression only:
  // bool use_delta_palette = false;  // Reserved for future lossless feature.

  // // Performance parameters (no impact on encoded bytes):
  // int thread_level = 0;     // If non-zero, try and use multi-threaded
  // encoding. bool low_memory = false;  // Memory usage reduction (but CPU use
  // increase).

  // // Neural compression:
  // int use_neural_compression = 0;       // Neural network compression.
  // const char* graphdef_path = nullptr;  // Directory holding encoder /
  // decoder
  //                                       // graphdefs structure:
  //                                       // base/qq/[en|de]coder.pbbin

  // EncoderInfo* info = nullptr;   // If not
};

val encode(std::string image_in, int image_width, int image_height,
           WP2Options options) {
  WP2Status status;
  uint8_t *image_buffer = (uint8_t *)image_in.c_str();
  WP2::ArgbBuffer src = WP2::ArgbBuffer();
  status = src.Import(WP2_rgbA_32, // Format. WP2_RGBA_32 is the same but NOT
                                   // premultiplied alpha
                      image_width, image_height, image_buffer, 4 * image_width);
  if (status != WP2_STATUS_OK) {
    return val(1);
  }

  WP2::MemoryWriter memory_writer;
  WP2::EncoderConfig config;
  config.quality = options.quality;
  config.alpha_quality = options.alpha_quality;
  config.speed = options.speed;
  config.pass = options.pass;
  config.sns = options.sns;
  status = WP2::Encode(src, &memory_writer, config);
  if (status != WP2_STATUS_OK) {
    return val(2);
  }

  return val(typed_memory_view(memory_writer.size_, memory_writer.mem_));
  // Lol I forgot to add the free here.
}

EMSCRIPTEN_BINDINGS(my_module) {
  value_object<WP2Options>("WP2Options")
      .field("quality", &WP2Options::quality)
      .field("alpha_quality", &WP2Options::alpha_quality)
      .field("speed", &WP2Options::speed)
      .field("pass", &WP2Options::pass)
      .field("sns", &WP2Options::sns);

  function("encode", &encode);
}
