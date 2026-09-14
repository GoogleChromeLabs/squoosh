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
#include <limits>
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

// Releases a std::string's heap buffer immediately. Clearing alone keeps the
// capacity allocated, so swap with an empty string to actually hand the memory
// back to the allocator.
void FreeString(std::string& s) { std::string().swap(s); }

jxl::ImageBundle RgbaToImageBundle(const uint8_t* rgba, size_t width, size_t height,
                                   bool has_alpha, const jxl::ImageMetadata* metadata) {
  jxl::Image3F color(width, height);
  // Only allocate the alpha plane when it will actually be used: it's another
  // 4 bytes/px on top of the 12 the colour planes already cost. The reference
  // always needs one (see the constructor), but a fully-opaque distorted image
  // doesn't, and that's the common case.
  jxl::ImageF alpha;
  if (has_alpha) {
    alpha = jxl::ImageF(width, height);
  }

  const float kInv255 = 1.0f / 255.0f;
  for (size_t y = 0; y < height; ++y) {
    float* JXL_RESTRICT row_r = color.PlaneRow(0, y);
    float* JXL_RESTRICT row_g = color.PlaneRow(1, y);
    float* JXL_RESTRICT row_b = color.PlaneRow(2, y);
    float* JXL_RESTRICT row_a = has_alpha ? alpha.Row(y) : nullptr;
    const uint8_t* JXL_RESTRICT src = rgba + y * width * 4;
    for (size_t x = 0; x < width; ++x) {
      row_r[x] = src[x * 4 + 0] * kInv255;
      row_g[x] = src[x * 4 + 1] * kInv255;
      row_b[x] = src[x * 4 + 2] * kInv255;
    }
    if (has_alpha) {
      for (size_t x = 0; x < width; ++x) {
        row_a[x] = src[x * 4 + 3] * kInv255;
      }
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
    // A bundle's metadata has to agree with the planes it actually holds:
    // SetAlpha() aborts if the metadata declares no alpha channel, and libjxl
    // asserts the other way round when metadata promises an alpha channel the
    // bundle doesn't have. compare() decides per call whether alpha is needed
    // (either image being transparent is enough), so keep one of each and hand
    // every bundle the matching one.
    metadata_.color_encoding = jxl::ColorEncoding::SRGB(/*is_gray=*/false);
    metadata_alpha_.color_encoding = jxl::ColorEncoding::SRGB(/*is_gray=*/false);
    metadata_alpha_.SetAlphaBits(8);
    // Give the reference an alpha plane whenever the distorted image might turn
    // out to be transparent, i.e. always - compare() only learns that later,
    // and both bundles passed to the metric must agree on having alpha. A
    // fully-opaque alpha plane doesn't change the score (AlphaBlend over an
    // opaque image is the identity), it just costs 4 bytes/px on the reference.
    original_ = RgbaToImageBundle(rgba, width_, height_, /*has_alpha=*/true,
                                  MetadataFor(/*has_alpha=*/true));
    // Embind copied the whole RGBA buffer into wasm memory to make this
    // std::string (4 bytes/px). It's redundant the moment the float bundle
    // exists, so drop it now rather than at end of scope - on a large image
    // that's over 100 MB kept out of the peak.
    FreeString(original);
  }

  // Returns the SSIMULACRA 2 score comparing `distorted` against the original,
  // or NaN if the image is smaller than the metric's 8x8 minimum.
  //
  // NaN rather than a negative sentinel because the metric's real scores run to
  // -inf: this wrapper routinely produces -1.x and -70.x on ordinary input, so
  // any in-band number would be indistinguishable from a genuine score.
  //
  // There is deliberately no maximum-size check. How large an image fits
  // depends on how far the host will grow the heap, which we can't know from
  // here - so we let the allocation fail and leave it to the caller. libjxl
  // aborts the whole module when that happens, so the JS wrapper catches the
  // trap and rebuilds the instance.
  double compare(std::string distorted) {
    if (width_ < 8 || height_ < 8) {
      return std::numeric_limits<double>::quiet_NaN();
    }
    const uint8_t* rgba = reinterpret_cast<const uint8_t*>(distorted.data());

    // The dual dark/bright blend below only matters when there's actually
    // transparency to blend. If both images are fully opaque, a single
    // comparison is exact and half the work. (The distorted image's
    // transparency matters too: blending against a background changes its
    // pixels even if the original is opaque.)
    bool has_alpha =
        original_has_transparency_ || HasTransparency(rgba, width_, height_);
    jxl::ImageBundle dist =
        RgbaToImageBundle(rgba, width_, height_, has_alpha, MetadataFor(has_alpha));
    // Likewise release Embind's copy of the distorted buffer before the metric
    // allocates its scale pyramid, which is where peak heap is reached.
    FreeString(distorted);

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
  const jxl::ImageMetadata* MetadataFor(bool has_alpha) const {
    return has_alpha ? &metadata_alpha_ : &metadata_;
  }

  jxl::ImageMetadata metadata_;
  jxl::ImageMetadata metadata_alpha_;
  jxl::ImageBundle original_;
  bool original_has_transparency_ = false;
  int width_;
  int height_;
};

EMSCRIPTEN_BINDINGS(ssimulacra2_module) {
  class_<Ssimulacra2>("Ssimulacra2")
      .constructor<std::string, int, int>()
      .function("compare", &Ssimulacra2::compare);
}
