#include <emscripten/bind.h>
#include <emscripten/threading.h>
#include <emscripten/val.h>

#include <algorithm>
#include <cstdio>
#include <vector>

#include <jxl/encode.h>
#include <jxl/encode_cxx.h>
#include <jxl/resizable_parallel_runner.h>
#include <jxl/resizable_parallel_runner_cxx.h>

using namespace emscripten;

thread_local const val Uint8Array = val::global("Uint8Array");

// Input from the browser is always 8-bit sRGB RGBA, one byte per channel.
#define COMPONENTS_PER_PIXEL 4

// Per-encode tracing to stderr (input params, output size). Compiled out unless
// JXL_ENC_DEBUG is defined, which the Makefile sets for DEBUG_BUILD=1. Failure
// logging (EXPECT_SUCCESS and the ProcessOutput error below) stays always-on -
// it only fires when encode() is about to return null, so it's never noise.
#ifdef JXL_ENC_DEBUG
#define JXL_ENC_LOG(...) fprintf(stderr, __VA_ARGS__)
#else
#define JXL_ENC_LOG(...) ((void)0)
#endif

// Human-readable name for a JxlEncoderError, for logging on failure.
static const char* JxlEncoderErrorName(JxlEncoderError err) {
  switch (err) {
    case JXL_ENC_ERR_OK: return "OK";
    case JXL_ENC_ERR_GENERIC: return "GENERIC";
    case JXL_ENC_ERR_OOM: return "OUT_OF_MEMORY";
    case JXL_ENC_ERR_JBRD: return "JPEG_BITSTREAM_RECONSTRUCTION";
    case JXL_ENC_ERR_BAD_INPUT: return "BAD_INPUT";
    case JXL_ENC_ERR_NOT_SUPPORTED: return "NOT_SUPPORTED";
    case JXL_ENC_ERR_API_USAGE: return "API_USAGE";
    default: return "UNKNOWN";
  }
}

// Bail out of encode() returning null if a libjxl call doesn't succeed, logging
// which call failed and the encoder's specific error code. Mirrors the EXPECT_*
// helpers in dec/jxl_dec.cpp. `enc` must be in scope (the JxlEncoderPtr).
#define EXPECT_SUCCESS(a)                                                     \
  if ((a) != JXL_ENC_SUCCESS) {                                              \
    JxlEncoderError err_ = JxlEncoderGetError(enc.get());                    \
    fprintf(stderr, "jxl_enc: %s failed at %s:%d (encoder error %d: %s)\n",  \
            #a, __FILE__, __LINE__, err_, JxlEncoderErrorName(err_));        \
    return val::null();                                                       \
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
  JXL_ENC_LOG("jxl_enc: encoding %dx%d (%zu bytes in), quality=%g lossless=%d effort=%d\n",
              width, height, image.size(), options.quality, options.lossless, options.effort);

  JxlEncoderPtr enc = JxlEncoderMake(/*memory_manager=*/nullptr);

  // Run libjxl's work across worker threads. The resizable runner picks a thread
  // count from the image size; we cap it to the number of logical cores
  // (navigator.hardwareConcurrency), which is also the size of the pthread pool
  // preloaded at module load. Never asking for more threads than the pool holds
  // is what avoids the mid-encode pthread deadlock that bites Chrome/Safari when
  // a worker has to be spawned while the main thread is blocked inside encode.
  JxlResizableParallelRunnerPtr runner = JxlResizableParallelRunnerMake(nullptr);
  size_t threads =
      std::min<uint64_t>(JxlResizableParallelRunnerSuggestThreads(width, height),
                         emscripten_num_logical_cores());
  JxlResizableParallelRunnerSetThreads(runner.get(), threads);
  JXL_ENC_LOG("jxl_enc: using %zu threads (%d cores)\n", threads,
              emscripten_num_logical_cores());
  EXPECT_SUCCESS(JxlEncoderSetParallelRunner(enc.get(), JxlResizableParallelRunner,
                                             runner.get()));

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
    JxlEncoderError err = JxlEncoderGetError(enc.get());
    fprintf(stderr, "jxl_enc: JxlEncoderProcessOutput failed (encoder error %d: %s)\n",
            err, JxlEncoderErrorName(err));
    return val::null();
  }
  compressed.resize(next_out - compressed.data());

  JXL_ENC_LOG("jxl_enc: done, %zu bytes out\n", compressed.size());

  return Uint8Array.new_(typed_memory_view(compressed.size(), compressed.data()));
}

EMSCRIPTEN_BINDINGS(my_module) {
  value_object<JXLOptions>("JXLOptions")
      .field("quality", &JXLOptions::quality)
      .field("lossless", &JXLOptions::lossless)
      .field("effort", &JXLOptions::effort);

  function("encode", &encode);
}
