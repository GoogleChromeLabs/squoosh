// Emscripten/Embind wrapper around Cloudinary's SSIMULACRA 2 metric.
//
// SSIMULACRA 2 compares a distorted image against an original and returns a
// score, typically in the range -inf..100, where higher is better:
//   90 = very high quality (visually lossless at 1:1)
//   70 = high quality
//   50 = medium quality
//   30 = low quality
//
// The JS API mirrors the other comparison-metric codecs (e.g. visdif): construct
// with the original image, then call `compare()` with each distorted image.
//
//   const ss = new module.Ssimulacra2(originalRGBA, width, height);
//   const score = ss.compare(distortedRGBA);
//
// Both buffers are interleaved 8-bit RGBA (4 bytes/pixel) of the same
// dimensions. Minimum image size is 8x8 pixels (a smaller image returns -1).

#include <emscripten/bind.h>
#include <emscripten/val.h>

#include <algorithm>
#include <cstdint>
#include <string>

#include "lib/jxl/base/span.h"
#include "lib/jxl/color_encoding_internal.h"
#include "lib/jxl/image.h"
#include "lib/jxl/image_bundle.h"
#include "lib/jxl/image_metadata.h"
#include "ssimulacra2.h"

using namespace emscripten;

namespace {

// Builds a libjxl ImageBundle from an interleaved 8-bit RGBA buffer. The colour
// is stored as sRGB (the encoding SSIMULACRA 2 then transforms to linear sRGB
// internally). libjxl's float images use the 0..1 range. The returned bundle
// borrows `metadata`, which must outlive it.
// Returns true if any pixel in the interleaved RGBA buffer is not fully opaque
// (alpha < 255).
bool HasTransparency(const uint8_t* rgba, size_t width, size_t height) {
  const size_t pixels = width * height;
  for (size_t i = 0; i < pixels; ++i) {
    if (rgba[i * 4 + 3] != 255) {
      return true;
    }
  }
  return false;
}

jxl::ImageBundle RgbaToImageBundle(const uint8_t* rgba, size_t width, size_t height,
                                   bool has_alpha, const jxl::ImageMetadata* metadata) {
  jxl::Image3F color(width, height);
  jxl::ImageF alpha(width, height);

  const float kInv255 = 1.0f / 255.0f;
  for (size_t y = 0; y < height; ++y) {
    float* JXL_RESTRICT row_r = color.PlaneRow(0, y);
    float* JXL_RESTRICT row_g = color.PlaneRow(1, y);
    float* JXL_RESTRICT row_b = color.PlaneRow(2, y);
    float* JXL_RESTRICT row_a = alpha.Row(y);
    const uint8_t* JXL_RESTRICT src = rgba + y * width * 4;
    for (size_t x = 0; x < width; ++x) {
      row_r[x] = src[x * 4 + 0] * kInv255;
      row_g[x] = src[x * 4 + 1] * kInv255;
      row_b[x] = src[x * 4 + 2] * kInv255;
      row_a[x] = src[x * 4 + 3] * kInv255;
    }
  }

  jxl::ImageBundle bundle(metadata);
  bundle.SetFromImage(std::move(color), jxl::ColorEncoding::SRGB(/*is_gray=*/false));
  if (has_alpha) {
    bundle.SetAlpha(std::move(alpha), /*alpha_is_premultiplied=*/false);
  }
  return bundle;
}

}  // namespace

class Ssimulacra2 {
 public:
  // `original` is an interleaved 8-bit RGBA buffer of width*height*4 bytes.
  Ssimulacra2(std::string original, int width, int height)
      : width_(width), height_(height) {
    const uint8_t* rgba = reinterpret_cast<const uint8_t*>(original.data());
    // Only treat the image as having alpha if it's actually transparent
    // anywhere. A fully-opaque original lets compare() skip the (doubled) blend
    // work, and keeps libjxl from doing needless alpha handling.
    original_has_transparency_ = HasTransparency(rgba, width_, height_);
    if (original_has_transparency_) {
      metadata_.SetAlphaBits(8);
    }
    metadata_.color_encoding = jxl::ColorEncoding::SRGB(/*is_gray=*/false);
    original_ = RgbaToImageBundle(rgba, width_, height_,
                                  /*has_alpha=*/original_has_transparency_, &metadata_);
  }

  // Returns the SSIMULACRA 2 score comparing `distorted` against the original,
  // or -1 if the images are too small (minimum 8x8).
  double compare(std::string distorted) {
    if (width_ < 8 || height_ < 8) {
      return -1.0;
    }
    const uint8_t* rgba = reinterpret_cast<const uint8_t*>(distorted.data());

    // The dual dark/bright blend below only matters when there's actually
    // transparency to blend. If both images are fully opaque, a single
    // comparison is exact and half the work. (The distorted image's
    // transparency matters too: blending against a background changes its
    // pixels even if the original is opaque.)
    bool has_alpha =
        original_has_transparency_ || HasTransparency(rgba, width_, height_);
    jxl::ImageBundle dist = RgbaToImageBundle(rgba, width_, height_, has_alpha, &metadata_);

    if (!has_alpha) {
      return ComputeSSIMULACRA2(original_, dist).Score();
    }
    // With transparency, blend against both dark and bright backgrounds and
    // return the worse of the two scores (matching ssimulacra2_main.cc).
    double score_dark = ComputeSSIMULACRA2(original_, dist, 0.1f).Score();
    double score_bright = ComputeSSIMULACRA2(original_, dist, 0.9f).Score();
    return std::min(score_dark, score_bright);
  }

 private:
  jxl::ImageMetadata metadata_;
  jxl::ImageBundle original_;
  bool original_has_transparency_;
  int width_;
  int height_;
};

EMSCRIPTEN_BINDINGS(ssimulacra2_module) {
  class_<Ssimulacra2>("Ssimulacra2")
      .constructor<std::string, int, int>()
      .function("compare", &Ssimulacra2::compare);
}
