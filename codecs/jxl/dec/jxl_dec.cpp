#include <emscripten/bind.h>
#include <emscripten/val.h>

#include <jxl/decode.h>
#include "lib/jxl/color_encoding_internal.h"

#include "skcms.h"

using namespace emscripten;

thread_local const val Uint8ClampedArray = val::global("Uint8ClampedArray");
thread_local const val ImageData = val::global("ImageData");

// R, G, B, A
#define COMPONENTS_PER_PIXEL 4

#define EXPECT_TRUE(a) \
  if (!(a))            \
    return val::null();

#define EXPECT_EQ(a, b) EXPECT_TRUE((a) == (b));

val decode(std::string data) {
  std::unique_ptr<JxlDecoder,
                  std::integral_constant<decltype(&JxlDecoderDestroy), JxlDecoderDestroy>>
      dec(JxlDecoderCreate(nullptr));
  EXPECT_EQ(JXL_DEC_SUCCESS,
            JxlDecoderSubscribeEvents(
                dec.get(), JXL_DEC_BASIC_INFO | JXL_DEC_COLOR_ENCODING | JXL_DEC_FULL_IMAGE));

  auto next_in = (const uint8_t*)data.c_str();
  auto avail_in = data.size();
  EXPECT_EQ(JXL_DEC_BASIC_INFO, JxlDecoderProcessInput(dec.get(), &next_in, &avail_in));
  JxlBasicInfo info;
  EXPECT_EQ(JXL_DEC_SUCCESS, JxlDecoderGetBasicInfo(dec.get(), &info));
  size_t pixel_count = info.xsize * info.ysize;
  size_t component_count = pixel_count * COMPONENTS_PER_PIXEL;

  EXPECT_EQ(JXL_DEC_COLOR_ENCODING, JxlDecoderProcessInput(dec.get(), &next_in, &avail_in));
  size_t icc_size;
  EXPECT_EQ(JXL_DEC_SUCCESS,
            JxlDecoderGetICCProfileSize(dec.get(), JXL_COLOR_PROFILE_TARGET_DATA, &icc_size));
  std::vector<uint8_t> icc_profile(icc_size);
  EXPECT_EQ(JXL_DEC_SUCCESS,
            JxlDecoderGetColorAsICCProfile(dec.get(), JXL_COLOR_PROFILE_TARGET_DATA,
                                           icc_profile.data(), icc_profile.size()));

  auto float_pixels = std::make_unique<float[]>(component_count);
  static const JxlPixelFormat format = {COMPONENTS_PER_PIXEL, JXL_LITTLE_ENDIAN, JXL_TYPE_FLOAT};
  EXPECT_EQ(JXL_DEC_SUCCESS, JxlDecoderSetImageOutBuffer(dec.get(), &format, float_pixels.get(),
                                                         component_count * sizeof(float)));
  EXPECT_EQ(JXL_DEC_FULL_IMAGE, JxlDecoderProcessInput(dec.get(), &next_in, &avail_in));

  auto byte_pixels = std::make_unique<uint8_t[]>(component_count);
  // Convert to sRGB.
  skcms_ICCProfile jxl_profile;
  // If the image is encoded in its original color space, the decoded data will be in the color
  // space defined by the decoded ICC profile. Otherwise, it is in Linear sRGB. TODO: the decoded
  // color profile should also be Linear sRGB if !uses_original_profile.
  if (info.uses_original_profile) {
    EXPECT_TRUE(skcms_Parse(icc_profile.data(), icc_profile.size(), &jxl_profile));
  } else {
    auto s = jxl::ColorEncoding::LinearSRGB(/*gray=*/false);
    EXPECT_TRUE(s.CreateICC());
    EXPECT_TRUE(skcms_Parse(s.ICC().data(), s.ICC().size(), &jxl_profile));
  }
  EXPECT_TRUE(skcms_Transform(
      float_pixels.get(), skcms_PixelFormat_RGBA_ffff,
      info.alpha_premultiplied ? skcms_AlphaFormat_PremulAsEncoded : skcms_AlphaFormat_Unpremul,
      &jxl_profile, byte_pixels.get(), skcms_PixelFormat_RGBA_8888, skcms_AlphaFormat_Unpremul,
      skcms_sRGB_profile(), pixel_count));

  return ImageData.new_(
      Uint8ClampedArray.new_(typed_memory_view(component_count, byte_pixels.get())), info.xsize,
      info.ysize);
}

EMSCRIPTEN_BINDINGS(my_module) {
  function("decode", &decode);
}
