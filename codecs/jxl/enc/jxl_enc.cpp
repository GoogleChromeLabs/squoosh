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
  // 0-100 quality for the alpha channel, or -1 to use the same as `quality`
  // (matching codecs/avif's qualityAlpha convention). Ignored when lossless.
  float qualityAlpha;
  // Mathematically lossless encoding.
  bool lossless;
  // libjxl effort / speed tier, 1 (fastest) - 9 (slowest, best compression).
  int effort;
  // Encoding mode (MODULAR): false = VarDCT (photographic), true = modular.
  // Only meaningful for lossy - lossless always uses modular internally.
  bool modular;
  // "Progressive" toggle. Routes to PROGRESSIVE_AC in VarDCT mode, or to
  // RESPONSIVE in modular mode (responsive is modular's progressive knob).
  bool progressiveAC;
  // Progressive AC using LSB quantization (QPROGRESSIVE_AC, ~ --qprogressive_ac).
  // In libjxl this takes precedence over progressiveAC when both are set.
  bool qProgressiveAC;
  // Extra lower-resolution DC passes (PROGRESSIVE_DC, ~ --progressive_dc):
  // 0 = off, 1 = one extra pass, 2 = two extra passes. Only meaningful as part
  // of a progressive encode, so it is ignored unless progressiveAC is set.
  int progressiveDC;
  // Group order (GROUP_ORDER, ~ --group_order): 0 = scanline, 1 = center-first
  // ("Expand"). Only has an effect during progressive (multi-pass) decode. We
  // leave the center at libjxl's default (image middle); an explicit center
  // can't be supported alongside progressive DC, since libjxl reuses one
  // unscaled pixel value across the full-res and reduced-resolution DC frames.
  int groupOrder;
  // Synthesized photographic noise as an ISO film speed (PHOTON_NOISE,
  // ~ --photon_noise_iso): 0 = off, higher = grainier (e.g. 100 low, 3200 high).
  // Lossy only; set via the float option API. Works in VarDCT and modular.
  float photonNoiseIso;
  // Decoding speed tier (DECODING_SPEED, ~ --faster_decoding): 0 (default,
  // slowest to decode but best density) to 4 (fastest to decode, at some cost
  // in quality/density). Trades encoded density for decode-side work, so unlike
  // `effort` it changes the bitstream. Applies to both VarDCT and modular, and
  // to lossless as well as lossy.
  int decodingSpeed;
};

val encode(std::string image, int width, int height, JXLOptions options) {
  JXL_ENC_LOG(
      "jxl_enc: encoding %dx%d (%zu bytes in), quality=%g qualityAlpha=%g lossless=%d effort=%d "
      "modular=%d progressiveAC=%d qProgressiveAC=%d progressiveDC=%d groupOrder=%d "
      "photonNoiseIso=%g decodingSpeed=%d\n",
      width, height, image.size(), options.quality, options.qualityAlpha, options.lossless,
      options.effort, options.modular, options.progressiveAC, options.qProgressiveAC,
      options.progressiveDC, options.groupOrder, options.photonNoiseIso,
      options.decodingSpeed);

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

  // The browser always hands us RGBA. Detect whether the alpha channel is
  // actually used: if every pixel is fully opaque we drop the alpha channel
  // entirely. Besides saving a redundant plane, this matters because libjxl
  // force-disables progressive DC whenever an image has any extra (alpha)
  // channel (see lib/jxl/enc_frame.cc), so an unused alpha plane would silently
  // suppress progressive DC.
  const uint8_t* pixels = reinterpret_cast<const uint8_t*>(image.data());
  const size_t pixel_count = static_cast<size_t>(width) * height;
  bool has_alpha = false;
  for (size_t i = 0; i < pixel_count; i++) {
    if (pixels[i * COMPONENTS_PER_PIXEL + 3] != 255) {
      has_alpha = true;
      break;
    }
  }
  JXL_ENC_LOG("jxl_enc: has_alpha=%d\n", has_alpha);

  JxlBasicInfo basic_info;
  JxlEncoderInitBasicInfo(&basic_info);
  basic_info.xsize = width;
  basic_info.ysize = height;
  basic_info.bits_per_sample = 8;
  basic_info.num_color_channels = 3;
  if (has_alpha) {
    // Alpha is one extra channel of 8 bits.
    basic_info.alpha_bits = 8;
    basic_info.alpha_exponent_bits = 0;
    basic_info.num_extra_channels = 1;
  }
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

  // Optimise the bitstream for faster decoding. 0 is libjxl's default, so only
  // set it when a higher tier was asked for. Unlike the lossy-only knobs below
  // this is set unconditionally - it affects lossless encodes too.
  if (options.decodingSpeed > 0) {
    EXPECT_SUCCESS(JxlEncoderFrameSettingsSetOption(
        frame_settings, JXL_ENC_FRAME_SETTING_DECODING_SPEED, options.decodingSpeed));
  }

  // Mode only applies to lossy: lossless always uses modular internally, so we
  // leave MODULAR at its default there and let libjxl force it.
  bool modular = !options.lossless && options.modular;
  if (modular) {
    EXPECT_SUCCESS(JxlEncoderFrameSettingsSetOption(
        frame_settings, JXL_ENC_FRAME_SETTING_MODULAR, 1));
  }

  // Modular is always responsive (progressive). Non-responsive modular produces
  // much larger files for little benefit, so we don't expose the choice - the
  // VarDCT-only "Progressive" toggle and its extras don't apply in modular mode.
  if (modular) {
    EXPECT_SUCCESS(JxlEncoderFrameSettingsSetOption(
        frame_settings, JXL_ENC_FRAME_SETTING_RESPONSIVE, 1));
  } else if (options.progressiveAC) {
    // VarDCT progressive. The extras (qProgressiveAC, progressiveDC) and group
    // order are VarDCT-only and only meaningful within a progressive encode.
    EXPECT_SUCCESS(JxlEncoderFrameSettingsSetOption(
        frame_settings, JXL_ENC_FRAME_SETTING_PROGRESSIVE_AC, 1));
    if (options.qProgressiveAC) {
      EXPECT_SUCCESS(JxlEncoderFrameSettingsSetOption(
          frame_settings, JXL_ENC_FRAME_SETTING_QPROGRESSIVE_AC, 1));
    }

    if (options.progressiveDC > 0) {
      EXPECT_SUCCESS(JxlEncoderFrameSettingsSetOption(
          frame_settings, JXL_ENC_FRAME_SETTING_PROGRESSIVE_DC, options.progressiveDC));
    }
  }

  if (!modular) {
    // Group order: 0 = scanline (raster), 1 = center-first. We don't set
    // CENTER_X/CENTER_Y (left at libjxl's default image middle) - see the
    // struct comment.
    EXPECT_SUCCESS(JxlEncoderFrameSettingsSetOption(
        frame_settings, JXL_ENC_FRAME_SETTING_GROUP_ORDER, options.groupOrder));

    // Center-first ordering is only applied on libjxl's *non-streaming* encode
    // path (PermuteGroups in enc_frame.cc). The streaming path
    // (ComputePermutationForStreaming) hardcodes raster order and ignores the
    // centerfirst flag, and streaming is the default for large images (>8
    // groups). Progressive incidentally disables streaming, which is why
    // center-first otherwise only worked with progressive on. Force buffering
    // off so the non-streaming path runs and center-first actually takes
    // effect regardless of progressive. (Costs some memory/speed on large
    // images, hence only when center-first is requested.)
    if (options.groupOrder == 1) {
      EXPECT_SUCCESS(JxlEncoderFrameSettingsSetOption(
          frame_settings, JXL_ENC_FRAME_SETTING_BUFFERING, 0));
    }
  }

  if (options.lossless) {
    EXPECT_SUCCESS(JxlEncoderSetFrameLossless(frame_settings, JXL_TRUE));
  } else {
    EXPECT_SUCCESS(JxlEncoderSetFrameDistance(
        frame_settings, JxlEncoderDistanceFromQuality(options.quality)));
    // qualityAlpha of -1 means "same as the colour quality"; libjxl already
    // applies the frame distance to the alpha channel by default, so we only
    // override when a separate alpha quality was requested. The alpha channel is
    // extra channel index 0 (num_extra_channels == 1). Only relevant if the
    // image actually has alpha.
    if (has_alpha && options.qualityAlpha >= 0) {
      EXPECT_SUCCESS(JxlEncoderSetExtraChannelDistance(
          frame_settings, /*index=*/0,
          JxlEncoderDistanceFromQuality(options.qualityAlpha)));
    }

    // Synthesized photographic noise (ISO film speed). Float option; only set
    // when requested. Lossy only - it's in this branch by construction.
    if (options.photonNoiseIso > 0) {
      EXPECT_SUCCESS(JxlEncoderFrameSettingsSetFloatOption(
          frame_settings, JXL_ENC_FRAME_SETTING_PHOTON_NOISE, options.photonNoiseIso));
    }
  }

  // Feed RGBA as-is when there's alpha; otherwise repack to RGB so the pixel
  // format matches the 3-channel (no extra channel) basic info we set above.
  if (has_alpha) {
    const JxlPixelFormat pixel_format = {4, JXL_TYPE_UINT8, JXL_NATIVE_ENDIAN, 0};
    EXPECT_SUCCESS(JxlEncoderAddImageFrame(frame_settings, &pixel_format, pixels,
                                           image.size()));
  } else {
    std::vector<uint8_t> rgb(pixel_count * 3);
    for (size_t i = 0; i < pixel_count; i++) {
      rgb[i * 3 + 0] = pixels[i * COMPONENTS_PER_PIXEL + 0];
      rgb[i * 3 + 1] = pixels[i * COMPONENTS_PER_PIXEL + 1];
      rgb[i * 3 + 2] = pixels[i * COMPONENTS_PER_PIXEL + 2];
    }
    const JxlPixelFormat pixel_format = {3, JXL_TYPE_UINT8, JXL_NATIVE_ENDIAN, 0};
    EXPECT_SUCCESS(
        JxlEncoderAddImageFrame(frame_settings, &pixel_format, rgb.data(), rgb.size()));
  }
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
      .field("qualityAlpha", &JXLOptions::qualityAlpha)
      .field("lossless", &JXLOptions::lossless)
      .field("effort", &JXLOptions::effort)
      .field("modular", &JXLOptions::modular)
      .field("progressiveAC", &JXLOptions::progressiveAC)
      .field("qProgressiveAC", &JXLOptions::qProgressiveAC)
      .field("progressiveDC", &JXLOptions::progressiveDC)
      .field("groupOrder", &JXLOptions::groupOrder)
      .field("photonNoiseIso", &JXLOptions::photonNoiseIso)
      .field("decodingSpeed", &JXLOptions::decodingSpeed);

  function("encode", &encode);
}
