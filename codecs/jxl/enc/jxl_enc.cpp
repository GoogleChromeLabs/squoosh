#include <emscripten/bind.h>
#include <emscripten/val.h>

#include <vector>

#include <jxl/encode.h>
#include <jxl/encode_cxx.h>

using namespace emscripten;

thread_local const val Uint8Array = val::global("Uint8Array");

// Input from the browser is always 8-bit sRGB RGBA, one byte per channel.
#define COMPONENTS_PER_PIXEL 4

// Bail out of encode() returning null if a libjxl call doesn't succeed. Mirrors
// the EXPECT_* helpers in dec/jxl_dec.cpp.
#define EXPECT_SUCCESS(a)         \
  if ((a) != JXL_ENC_SUCCESS) {   \
    return val::null();           \
  }

struct JXLOptions {
  // 0-100 quality slider, matching the rest of Squoosh. Mapped to a
  // butteraugli distance via JxlEncoderDistanceFromQuality. Ignored when
  // lossless is set.
  float quality;
  // Mathematically lossless encoding.
  bool lossless;
  // libjxl effort / speed tier, 1 (fastest) - 9 (slowest, best compression).
  int effort;
};

val encode(std::string image, int width, int height, JXLOptions options) {
  JxlEncoderPtr enc = JxlEncoderMake(/*memory_manager=*/nullptr);
  // Single-threaded: no parallel runner. libjxl runs inline on the calling
  // thread, which is the codec's worker. (Threads are a future experiment.)

  JxlBasicInfo basic_info;
  JxlEncoderInitBasicInfo(&basic_info);
  basic_info.xsize = width;
  basic_info.ysize = height;
  basic_info.bits_per_sample = 8;
  basic_info.num_color_channels = 3;
  // RGBA: the alpha channel is one extra channel of 8 bits.
  basic_info.alpha_bits = 8;
  basic_info.alpha_exponent_bits = 0;
  basic_info.num_extra_channels = 1;
  // Lossless requires the original colour profile to be preserved; lossy lets
  // libjxl transform to its internal XYB space for better compression.
  basic_info.uses_original_profile = options.lossless ? JXL_TRUE : JXL_FALSE;
  EXPECT_SUCCESS(JxlEncoderSetBasicInfo(enc.get(), &basic_info));

  JxlColorEncoding color_encoding = {};
  JxlColorEncodingSetToSRGB(&color_encoding, /*is_gray=*/JXL_FALSE);
  EXPECT_SUCCESS(JxlEncoderSetColorEncoding(enc.get(), &color_encoding));

  JxlEncoderFrameSettings* frame_settings =
      JxlEncoderFrameSettingsCreate(enc.get(), nullptr);

  EXPECT_SUCCESS(JxlEncoderFrameSettingsSetOption(
      frame_settings, JXL_ENC_FRAME_SETTING_EFFORT, options.effort));

  if (options.lossless) {
    EXPECT_SUCCESS(JxlEncoderSetFrameLossless(frame_settings, JXL_TRUE));
  } else {
    EXPECT_SUCCESS(JxlEncoderSetFrameDistance(
        frame_settings, JxlEncoderDistanceFromQuality(options.quality)));
  }

  const JxlPixelFormat pixel_format = {COMPONENTS_PER_PIXEL, JXL_TYPE_UINT8,
                                       JXL_NATIVE_ENDIAN, 0};
  EXPECT_SUCCESS(JxlEncoderAddImageFrame(frame_settings, &pixel_format,
                                         static_cast<const void*>(image.data()),
                                         image.size()));
  JxlEncoderCloseInput(enc.get());

  // Pull the compressed bytes out, growing the buffer as libjxl asks for room.
  std::vector<uint8_t> compressed(64);
  uint8_t* next_out = compressed.data();
  size_t avail_out = compressed.size();
  JxlEncoderStatus process_result = JXL_ENC_NEED_MORE_OUTPUT;
  while (process_result == JXL_ENC_NEED_MORE_OUTPUT) {
    process_result = JxlEncoderProcessOutput(enc.get(), &next_out, &avail_out);
    if (process_result == JXL_ENC_NEED_MORE_OUTPUT) {
      size_t offset = next_out - compressed.data();
      compressed.resize(compressed.size() * 2);
      next_out = compressed.data() + offset;
      avail_out = compressed.size() - offset;
    }
  }
  if (process_result != JXL_ENC_SUCCESS) {
    return val::null();
  }
  compressed.resize(next_out - compressed.data());

  return Uint8Array.new_(typed_memory_view(compressed.size(), compressed.data()));
}

EMSCRIPTEN_BINDINGS(my_module) {
  value_object<JXLOptions>("JXLOptions")
      .field("quality", &JXLOptions::quality)
      .field("lossless", &JXLOptions::lossless)
      .field("effort", &JXLOptions::effort);

  function("encode", &encode);
}
