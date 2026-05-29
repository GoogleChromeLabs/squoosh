#include <emscripten/bind.h>
#include <emscripten/threading.h>
#include <emscripten/val.h>
#include "avif/avif.h"

#include <algorithm>
#include <cmath>
#include <cstdint>
#include <memory>
#include <string>
#include <vector>

using namespace emscripten;

using AvifImagePtr = std::unique_ptr<avifImage, decltype(&avifImageDestroy)>;
using AvifEncoderPtr = std::unique_ptr<avifEncoder, decltype(&avifEncoderDestroy)>;

struct AvifOptions {
  // [0 - 100]
  // 0 = worst quality
  // 100 = lossless
  int quality;
  // As above, but -1 means 'use quality'
  int qualityAlpha;
  // [0 - 10]
  // 0 = slowest
  // 10 = fastest
  int speed;
  // 0 = 4:0:0
  // 1 = 4:2:0
  // 2 = 4:2:2
  // 3 = 4:4:4
  int subsample;
  // Adaptive quantization, driving libaom's delta-Q mode. (The older aq-mode is
  // superseded by delta-Q for the all-intra path AVIF uses, so it has no effect.)
  // 0 = default: don't set anything, so the mode follows libaom's own default
  //     for the chosen tune (e.g. variance-boost when tune resolves to IQ,
  //     objective otherwise). Matches output with the option not exposed.
  // 1 = off
  // 2 = perceptual
  // 3 = perceptual AI (tuned for all-intra / still images)
  // 4 = variance boost
  int aqMode;
  // Distortion metric the encoder is tuned for. Only applied to the color
  // channels; alpha keeps libaom's default (PSNR).
  // 0 = auto (let libaom pick its default, which is IQ for still images)
  // 1 = PSNR
  // 2 = SSIM
  // 3 = IQ
  int tune;
  // 0-50
  int denoiseLevel;
  // toggles AVIF_CHROMA_DOWNSAMPLING_SHARP_YUV
  bool enableSharpYUV;
  // Bit depth of the encoded image. One of 8, 10 or 12.
  int channelDepth;
  // Premultiply the colour channels by the alpha channel and signal this in the
  // AVIF. The source buffer is always non-premultiplied; libavif premultiplies
  // during the RGB->YUV conversion.
  bool premultiplyAlpha;
  // Encode a 2-layer "progressive" AVIF: a low-quality, optionally downscaled
  // and blurred base layer that renders first, followed by the full image.
  bool progressive;
  // Quality used for the progressive base layer's colour and alpha. [0 - 100]
  int progressiveQuality;
  // Index into the AOM scaling-mode table (see kScalingModes). In progressive
  // output the base layer's AV1 frame is encoded at this fraction of the full
  // resolution (via AOM's scaling mode) while the layer keeps the full render
  // size. In the preview it's the fraction the base content is downscaled to.
  int scalingMode;
  // Gaussian blur applied to the base layer, as a percentage of the image's
  // larger dimension (so it's visually consistent across image sizes). Converted
  // to a pixel sigma at encode time. 0 = no blur.
  float blur;
  // When set (and progressive is set), encode just the base layer's content so
  // the user can preview what the progressive frame looks like. It's written as
  // a plain single-image AVIF of the blurred, downscaled base content, returned
  // at the reduced size. (AOM's scaling mode can't be used for a standalone
  // image - only layered images decode reliably - so we downscale the pixels.)
  bool previewProgressiveFrame;
  // Force the progressive output's final (main) layer to be a keyframe, so it
  // decodes independently of the base layer rather than as a refinement of it.
  bool independentMainLayer;
};

// The scaling ratios AOM supports for layered (progressive) encoding. Indexed by
// AvifOptions::scalingMode. Mirrors scalingModeMap in libavif's src/codec_aom.c;
// any other fraction is rejected by libavif at encode time.
struct ScalingRatio {
  int32_t n;
  int32_t d;
};
static const ScalingRatio kScalingModes[] = {
    {1, 1}, {1, 2}, {1, 4}, {1, 8}, {3, 4}, {3, 5}, {4, 5},
};
static const int kScalingModeCount = sizeof(kScalingModes) / sizeof(kScalingModes[0]);

thread_local const val Uint8Array = val::global("Uint8Array");

// Applies a separable Gaussian blur to an 8-bit RGBA buffer in place. The blur
// runs in premultiplied-alpha space: colour is weighted by alpha before
// blurring and divided back out afterwards. This stops the (invisible) colour
// of fully-transparent pixels - typically black - from bleeding into and
// darkening visible edges (the classic unpremultiplied-blur halo).
// Sigma is the standard deviation in pixels; values <= 0 are a no-op.
static void gaussianBlurRGBA(uint8_t* pixels, int width, int height, float sigma) {
  if (sigma <= 0.0f || width <= 0 || height <= 0) {
    return;
  }

  // A radius of 3 sigma captures >99.7% of the kernel's weight.
  int radius = static_cast<int>(std::ceil(sigma * 3.0f));
  if (radius < 1) {
    return;
  }

  std::vector<float> kernel(radius + 1);
  float sum = 0.0f;
  const float twoSigmaSq = 2.0f * sigma * sigma;
  for (int i = 0; i <= radius; ++i) {
    kernel[i] = std::exp(-static_cast<float>(i * i) / twoSigmaSq);
    // Each non-centre tap is used on both sides, so count it twice in the sum.
    sum += (i == 0) ? kernel[i] : 2.0f * kernel[i];
  }
  for (int i = 0; i <= radius; ++i) {
    kernel[i] /= sum;
  }

  const int channels = 4;
  const size_t pixelCount = static_cast<size_t>(width) * height;

  // Premultiplied working buffer (RGB scaled by alpha, alpha kept as-is). Both
  // separable passes run on this; we round-trip through 8-bit only at the ends.
  std::vector<float> premul(pixelCount * channels);
  for (size_t i = 0; i < pixelCount; ++i) {
    const float a = pixels[i * channels + 3] / 255.0f;
    premul[i * channels + 0] = pixels[i * channels + 0] * a;
    premul[i * channels + 1] = pixels[i * channels + 1] * a;
    premul[i * channels + 2] = pixels[i * channels + 2] * a;
    premul[i * channels + 3] = pixels[i * channels + 3];
  }

  std::vector<float> scratch(pixelCount * channels);

  // Horizontal pass: premul -> scratch. Edges use clamp-to-edge sampling.
  for (int y = 0; y < height; ++y) {
    const float* srcRow = premul.data() + static_cast<size_t>(y) * width * channels;
    float* dstRow = scratch.data() + static_cast<size_t>(y) * width * channels;
    for (int x = 0; x < width; ++x) {
      float acc[channels] = {0, 0, 0, 0};
      for (int k = -radius; k <= radius; ++k) {
        int sx = x + k;
        if (sx < 0) sx = 0;
        if (sx >= width) sx = width - 1;
        const float w = kernel[std::abs(k)];
        const float* s = srcRow + static_cast<size_t>(sx) * channels;
        for (int c = 0; c < channels; ++c) {
          acc[c] += s[c] * w;
        }
      }
      float* d = dstRow + static_cast<size_t>(x) * channels;
      for (int c = 0; c < channels; ++c) {
        d[c] = acc[c];
      }
    }
  }

  // Vertical pass: scratch -> premul.
  for (int y = 0; y < height; ++y) {
    float* dstRow = premul.data() + static_cast<size_t>(y) * width * channels;
    for (int x = 0; x < width; ++x) {
      float acc[channels] = {0, 0, 0, 0};
      for (int k = -radius; k <= radius; ++k) {
        int sy = y + k;
        if (sy < 0) sy = 0;
        if (sy >= height) sy = height - 1;
        const float w = kernel[std::abs(k)];
        const float* s = scratch.data() + (static_cast<size_t>(sy) * width + x) * channels;
        for (int c = 0; c < channels; ++c) {
          acc[c] += s[c] * w;
        }
      }
      float* d = dstRow + static_cast<size_t>(x) * channels;
      for (int c = 0; c < channels; ++c) {
        d[c] = acc[c];
      }
    }
  }

  // Un-premultiply and write back to 8-bit. Where alpha is ~0 the colour is
  // undefined; leave it black, since it's fully transparent anyway.
  for (size_t i = 0; i < pixelCount; ++i) {
    const float a = premul[i * channels + 3];
    const float inv = a > 0.0f ? 255.0f / a : 0.0f;
    for (int c = 0; c < 3; ++c) {
      float v = premul[i * channels + c] * inv + 0.5f;
      if (v < 0.0f) v = 0.0f;
      if (v > 255.0f) v = 255.0f;
      pixels[i * channels + c] = static_cast<uint8_t>(v);
    }
    float av = premul[i * channels + 3] + 0.5f;
    if (av < 0.0f) av = 0.0f;
    if (av > 255.0f) av = 255.0f;
    pixels[i * channels + 3] = static_cast<uint8_t>(av);
  }
}

// Bilinearly downscales an 8-bit RGBA buffer to a new size. Used to build the
// progressive preview: a small, blurred, normal single-image AVIF showing what
// the base layer encodes to. (We don't use AOM's scaling mode for this because a
// standalone scaled image is not reliably decodable - only layered images are.)
static std::vector<uint8_t> resampleRGBA(const uint8_t* src, int srcW, int srcH, int dstW,
                                         int dstH) {
  const int channels = 4;
  std::vector<uint8_t> dst(static_cast<size_t>(dstW) * dstH * channels);
  if (dstW <= 0 || dstH <= 0) {
    return dst;
  }
  // Map dst pixel centres back into src space.
  const float scaleX = static_cast<float>(srcW) / dstW;
  const float scaleY = static_cast<float>(srcH) / dstH;
  for (int y = 0; y < dstH; ++y) {
    float sy = (y + 0.5f) * scaleY - 0.5f;
    int y0 = static_cast<int>(std::floor(sy));
    float fy = sy - y0;
    int y1 = y0 + 1;
    if (y0 < 0) y0 = 0;
    if (y0 >= srcH) y0 = srcH - 1;
    if (y1 < 0) y1 = 0;
    if (y1 >= srcH) y1 = srcH - 1;
    for (int x = 0; x < dstW; ++x) {
      float sx = (x + 0.5f) * scaleX - 0.5f;
      int x0 = static_cast<int>(std::floor(sx));
      float fx = sx - x0;
      int x1 = x0 + 1;
      if (x0 < 0) x0 = 0;
      if (x0 >= srcW) x0 = srcW - 1;
      if (x1 < 0) x1 = 0;
      if (x1 >= srcW) x1 = srcW - 1;

      const uint8_t* p00 = src + (static_cast<size_t>(y0) * srcW + x0) * channels;
      const uint8_t* p01 = src + (static_cast<size_t>(y0) * srcW + x1) * channels;
      const uint8_t* p10 = src + (static_cast<size_t>(y1) * srcW + x0) * channels;
      const uint8_t* p11 = src + (static_cast<size_t>(y1) * srcW + x1) * channels;
      uint8_t* d = dst.data() + (static_cast<size_t>(y) * dstW + x) * channels;
      for (int c = 0; c < channels; ++c) {
        float top = p00[c] * (1 - fx) + p01[c] * fx;
        float bottom = p10[c] * (1 - fx) + p11[c] * fx;
        d[c] = static_cast<uint8_t>(top * (1 - fy) + bottom * fy + 0.5f);
      }
    }
  }
  return dst;
}

// Builds an avifImage (YUV) from an 8-bit RGBA buffer, sharing the colour
// configuration decisions used for both the main and base layers. Returns null
// on failure.
static AvifImagePtr rgbaToAvifImage(const uint8_t* rgba, int width, int height, int depth,
                                    avifPixelFormat format, bool lossless,
                                    bool premultiplyAlpha, bool enableSharpYUV) {
  AvifImagePtr image(avifImageCreate(width, height, depth, format), avifImageDestroy);
  if (image == nullptr) {
    return image;
  }

  if (lossless) {
    // Identity matrix coefficients make the RGB->YUV conversion lossless (no
    // colour space conversion). Range must be full, which avifImageCreate
    // already defaults to.
    image->matrixCoefficients = AVIF_MATRIX_COEFFICIENTS_IDENTITY;
    image->yuvRange = AVIF_RANGE_FULL;
  } else {
    image->matrixCoefficients = AVIF_MATRIX_COEFFICIENTS_BT601;
  }
  image->alphaPremultiplied = premultiplyAlpha;

  avifRGBImage srcRGB;
  avifRGBImageSetDefaults(&srcRGB, image.get());
  // The source buffer is always 8-bit RGBA, regardless of the encoded image's
  // channel depth. avifImageRGBToYUV upconverts to image->depth as needed.
  srcRGB.format = AVIF_RGB_FORMAT_RGBA;
  srcRGB.depth = 8;
  srcRGB.pixels = const_cast<uint8_t*>(rgba);
  srcRGB.rowBytes = width * 4;
  if (enableSharpYUV) {
    // Higher-quality chroma downsampling. Only has an effect when chroma is
    // actually subsampled (e.g. 4:2:0).
    srcRGB.chromaDownsampling = AVIF_CHROMA_DOWNSAMPLING_SHARP_YUV;
  }

  if (avifImageRGBToYUV(image.get(), &srcRGB) != AVIF_RESULT_OK) {
    return AvifImagePtr(nullptr, avifImageDestroy);
  }
  return image;
}

// Applies the codec-specific options that are common to every encode (tune,
// delta-Q mode, denoise). Returns false on failure.
static bool applyCodecSpecificOptions(avifEncoder* encoder, const AvifOptions& options) {
  // Tune the encoder for a distortion metric. The "color:" prefix scopes this
  // to the color channels only, so alpha keeps libaom's default (PSNR). When
  // tune is "auto" we set nothing and let libaom pick its own default.
  const char* tune = nullptr;
  switch (options.tune) {
    case 1:
      tune = "psnr";
      break;
    case 2:
      tune = "ssim";
      break;
    case 3:
      tune = "iq";
      break;
  }
  if (tune != nullptr) {
    if (avifEncoderSetCodecSpecificOption(encoder, "color:tune", tune) != AVIF_RESULT_OK) {
      return false;
    }
  }

  // Adaptive quantization via libaom's delta-Q mode. Our option value 0 means
  // "leave libaom's default", so only set it for other values. Map our UI
  // values to libaom DELTAQ_MODE values (see encoder.h):
  //   1 -> 0 (NO_DELTA_Q)        2 -> 2 (perceptual)
  //   3 -> 3 (perceptual AI)     4 -> 6 (variance boost)
  int deltaqMode = -1;
  switch (options.aqMode) {
    case 1:
      deltaqMode = 0;
      break;
    case 2:
      deltaqMode = 2;
      break;
    case 3:
      deltaqMode = 3;
      break;
    case 4:
      deltaqMode = 6;
      break;
  }
  if (deltaqMode != -1) {
    if (avifEncoderSetCodecSpecificOption(encoder, "color:deltaq-mode",
                                          std::to_string(deltaqMode).c_str()) != AVIF_RESULT_OK) {
      return false;
    }
  }

  // Denoise the image as part of encoding. 0 is libaom's default (off), so only
  // set it when requested. Applies to the colour plane only; denoising the
  // monochrome alpha mask is meaningless.
  if (options.denoiseLevel != 0) {
    if (avifEncoderSetCodecSpecificOption(encoder, "color:denoise-noise-level",
                                          std::to_string(options.denoiseLevel).c_str()) !=
        AVIF_RESULT_OK) {
      return false;
    }
  }
  return true;
}

val encode(std::string buffer, int width, int height, AvifOptions options) {
  int depth = options.channelDepth;
  avifPixelFormat format;
  switch (options.subsample) {
    case 0:
      format = AVIF_PIXEL_FORMAT_YUV400;
      break;
    case 1:
      format = AVIF_PIXEL_FORMAT_YUV420;
      break;
    case 2:
      format = AVIF_PIXEL_FORMAT_YUV422;
      break;
    case 3:
      format = AVIF_PIXEL_FORMAT_YUV444;
      break;
    default:
      format = AVIF_PIXEL_FORMAT_YUV420;
      break;
  }

  // Lossless requires YUV444 (so the RGB->YUV step is a reversible repacking)
  // and full-quality color + alpha. qualityAlpha of -1 means "same as quality".
  bool lossless = options.quality == AVIF_QUALITY_LOSSLESS &&
                  (options.qualityAlpha == -1 || options.qualityAlpha == AVIF_QUALITY_LOSSLESS) &&
                  format == AVIF_PIXEL_FORMAT_YUV444;

  uint8_t* rgba = reinterpret_cast<uint8_t*>(const_cast<char*>(buffer.data()));

  const bool needBaseLayer = options.progressive;
  const bool preview = options.progressive && options.previewProgressiveFrame;

  // options.blur is a percentage of the image's larger dimension, so the same
  // value gives a visually consistent blur regardless of image size. Convert it
  // to a pixel sigma for the blur itself.
  const float blurSigma = options.blur / 100.0f * std::max(width, height);

  // Resolve the scaling fraction for the progressive base layer.
  int scalingIndex = options.scalingMode;
  if (scalingIndex < 0 || scalingIndex >= kScalingModeCount) {
    scalingIndex = 0;
  }
  const ScalingRatio ratio = kScalingModes[scalingIndex];
  const avifScalingMode baseScaling = {{ratio.n, ratio.d}, {ratio.n, ratio.d}};
  const avifScalingMode noScaling = {{1, 1}, {1, 1}};

  // Preview mode: show what the progressive base layer encodes to. We can't use
  // AOM's scaling mode for this - a standalone scaled image is not reliably
  // decodable (dav1d fails it outright; some decoders render it blank); only
  // layered images whose final layer is full resolution decode everywhere. So
  // the preview is a plain single-image AVIF of the blurred, downscaled base
  // content, returned at the reduced size.
  if (preview) {
    std::vector<uint8_t> blurred(rgba, rgba + static_cast<size_t>(width) * height * 4);
    gaussianBlurRGBA(blurred.data(), width, height, blurSigma);

    int baseW = static_cast<int>(static_cast<int64_t>(width) * ratio.n / ratio.d);
    int baseH = static_cast<int>(static_cast<int64_t>(height) * ratio.n / ratio.d);
    if (baseW < 1) baseW = 1;
    if (baseH < 1) baseH = 1;
    std::vector<uint8_t> baseRGBA = resampleRGBA(blurred.data(), width, height, baseW, baseH);

    AvifImagePtr previewImage =
        rgbaToAvifImage(baseRGBA.data(), baseW, baseH, depth, format, lossless,
                        options.premultiplyAlpha, options.enableSharpYUV);
    if (previewImage == nullptr) {
      return val::null();
    }

    AvifEncoderPtr encoder(avifEncoderCreate(), avifEncoderDestroy);
    if (encoder == nullptr) {
      return val::null();
    }
    encoder->quality = options.progressiveQuality;
    encoder->qualityAlpha = options.progressiveQuality;
    encoder->speed = options.speed;
    encoder->maxThreads = emscripten_num_logical_cores();
    encoder->autoTiling = AVIF_TRUE;
    if (!applyCodecSpecificOptions(encoder.get(), options)) {
      return val::null();
    }

    avifRWData output = AVIF_DATA_EMPTY;
    avifResult result = avifEncoderWrite(encoder.get(), previewImage.get(), &output);
    val js_result = val::null();
    if (result == AVIF_RESULT_OK) {
      js_result = Uint8Array.new_(typed_memory_view(output.size, output.data));
    }
    avifRWDataFree(&output);
    return js_result;
  }

  // The base layer for progressive output: the full-size image with a Gaussian
  // blur applied. The resolution reduction is signalled to AOM via scalingMode
  // (AOM encodes the AV1 frame at a lower internal resolution and records the
  // full render size); the image handed to the encoder is full size.
  AvifImagePtr baseImage(nullptr, avifImageDestroy);
  if (needBaseLayer) {
    std::vector<uint8_t> baseRGBA(rgba, rgba + static_cast<size_t>(width) * height * 4);
    gaussianBlurRGBA(baseRGBA.data(), width, height, blurSigma);
    baseImage = rgbaToAvifImage(baseRGBA.data(), width, height, depth, format, lossless,
                                options.premultiplyAlpha, options.enableSharpYUV);
    if (baseImage == nullptr) {
      return val::null();
    }
  }

  // The final, full-resolution, highest-quality image.
  AvifImagePtr image = rgbaToAvifImage(rgba, width, height, depth, format, lossless,
                                       options.premultiplyAlpha, options.enableSharpYUV);
  if (image == nullptr) {
    return val::null();
  }

  AvifEncoderPtr encoder(avifEncoderCreate(), avifEncoderDestroy);
  if (encoder == nullptr) {
    return val::null();
  }

  encoder->speed = options.speed;
  // The layered (progressive) encode must run single-threaded. We call encode()
  // synchronously on this Web Worker's own main thread; libaom's multi-threaded
  // GOOD_QUALITY pipeline (used for layered output) calls pthread_create during
  // the encode, which Emscripten proxies *back* to this blocked thread via the
  // mailbox/setTimeout - which never runs because we're blocked in Atomics.wait,
  // so it deadlocks. (Firefox happens to pump the mailbox during the wait and
  // survives; Chrome and Safari do not.) Single-image encodes use the ALL_INTRA
  // pipeline, which doesn't spawn threads mid-encode here, so they keep MT.
  // TODO: I don't know if the above slop is correct, but it does fix the issue.
  encoder->maxThreads = needBaseLayer ? 1 : emscripten_num_logical_cores();
  // Let libavif choose a sensible number of tiles based on image dimensions.
  encoder->autoTiling = AVIF_TRUE;
  // Progressive output has one extra layer (the base); a plain encode is a
  // single image.
  encoder->extraLayerCount = needBaseLayer ? 1 : 0;
  if (!applyCodecSpecificOptions(encoder.get(), options)) {
    return val::null();
  }

  const int finalQualityAlpha =
      options.qualityAlpha == -1 ? options.quality : options.qualityAlpha;

  avifRWData output = AVIF_DATA_EMPTY;
  avifResult encodeResult;

  if (needBaseLayer) {
    // Two-layer progressive AVIF. Both layers share the full image dimensions;
    // only the base layer's internal AV1 resolution is reduced via scalingMode.
    // The final layer must be full resolution (scaling 1/1) for the file to be
    // decodable across decoders.
    encoder->quality = options.progressiveQuality;
    encoder->qualityAlpha = options.progressiveQuality;
    encoder->scalingMode = baseScaling;
    if (avifEncoderAddImage(encoder.get(), baseImage.get(), 1, AVIF_ADD_IMAGE_FLAG_NONE) !=
        AVIF_RESULT_OK) {
      return val::null();
    }

    encoder->quality = options.quality;
    encoder->qualityAlpha = finalQualityAlpha;
    encoder->scalingMode = noScaling;
    // Optionally force the final layer to be a keyframe so it decodes
    // independently of the base layer rather than as a refinement of it.
    const avifAddImageFlags finalFlags = options.independentMainLayer
                                             ? AVIF_ADD_IMAGE_FLAG_FORCE_KEYFRAME
                                             : AVIF_ADD_IMAGE_FLAG_NONE;
    if (avifEncoderAddImage(encoder.get(), image.get(), 1, finalFlags) != AVIF_RESULT_OK) {
      return val::null();
    }

    encodeResult = avifEncoderFinish(encoder.get(), &output);
  } else {
    encoder->quality = options.quality;
    encoder->qualityAlpha = finalQualityAlpha;
    encodeResult = avifEncoderWrite(encoder.get(), image.get(), &output);
  }

  val js_result = val::null();
  if (encodeResult == AVIF_RESULT_OK) {
    js_result = Uint8Array.new_(typed_memory_view(output.size, output.data));
  }

  avifRWDataFree(&output);
  return js_result;
}

EMSCRIPTEN_BINDINGS(my_module) {
  value_object<AvifOptions>("AvifOptions")
      .field("quality", &AvifOptions::quality)
      .field("qualityAlpha", &AvifOptions::qualityAlpha)
      .field("speed", &AvifOptions::speed)
      .field("aqMode", &AvifOptions::aqMode)
      .field("tune", &AvifOptions::tune)
      .field("denoiseLevel", &AvifOptions::denoiseLevel)
      .field("subsample", &AvifOptions::subsample)
      .field("enableSharpYUV", &AvifOptions::enableSharpYUV)
      .field("channelDepth", &AvifOptions::channelDepth)
      .field("premultiplyAlpha", &AvifOptions::premultiplyAlpha)
      .field("progressive", &AvifOptions::progressive)
      .field("progressiveQuality", &AvifOptions::progressiveQuality)
      .field("scalingMode", &AvifOptions::scalingMode)
      .field("blur", &AvifOptions::blur)
      .field("previewProgressiveFrame", &AvifOptions::previewProgressiveFrame)
      .field("independentMainLayer", &AvifOptions::independentMainLayer);

  function("encode", &encode);
}
