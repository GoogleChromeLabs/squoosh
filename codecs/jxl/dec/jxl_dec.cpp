#include <emscripten/bind.h>
#include <emscripten/val.h>

#include <jxl/decode.h>
#include "lib/jxl/color_encoding_internal.h"

#include "skcms.h"

using namespace emscripten;

thread_local const val Uint8ClampedArray = val::global("Uint8ClampedArray");
thread_local const val ImageData = val::global("ImageData");

#define EXPECT_EQ(a, b)     \
  if ((a) != (b)) {         \
    JxlDecoderDestroy(dec); \
    return val::null();     \
  }

val decode(std::string data) {
  JxlDecoder* dec = JxlDecoderCreate(nullptr);
  EXPECT_EQ(JXL_DEC_SUCCESS,
            JxlDecoderSubscribeEvents(
                dec, JXL_DEC_BASIC_INFO | JXL_DEC_COLOR_ENCODING | JXL_DEC_FULL_IMAGE));
  auto next_in = (const uint8_t*)data.c_str();
  auto avail_in = data.size();
  EXPECT_EQ(JXL_DEC_BASIC_INFO, JxlDecoderProcessInput(dec, &next_in, &avail_in));
  size_t buffer_size;
  const JxlPixelFormat format = {4, JXL_LITTLE_ENDIAN, JXL_TYPE_FLOAT};
  EXPECT_EQ(JXL_DEC_SUCCESS, JxlDecoderImageOutBufferSize(dec, &format, &buffer_size));
  JxlBasicInfo info;
  EXPECT_EQ(JXL_DEC_SUCCESS, JxlDecoderGetBasicInfo(dec, &info));

  EXPECT_EQ(JXL_DEC_COLOR_ENCODING, JxlDecoderProcessInput(dec, &next_in, &avail_in));
  size_t icc_size;
  EXPECT_EQ(JXL_DEC_SUCCESS,
            JxlDecoderGetICCProfileSize(dec, JXL_COLOR_PROFILE_TARGET_DATA, &icc_size));
  std::vector<uint8_t> icc_profile(icc_size);
  EXPECT_EQ(JXL_DEC_SUCCESS,
            JxlDecoderGetColorAsICCProfile(dec, JXL_COLOR_PROFILE_TARGET_DATA, icc_profile.data(),
                                           icc_profile.size()));

  std::unique_ptr<float[]> float_pixels(new float[(buffer_size + 3) / 4]);
  EXPECT_EQ(JXL_DEC_SUCCESS,
            JxlDecoderSetImageOutBuffer(
                dec, &format, reinterpret_cast<uint8_t*>(float_pixels.get()), buffer_size));
  EXPECT_EQ(JXL_DEC_FULL_IMAGE, JxlDecoderProcessInput(dec, &next_in, &avail_in));
  JxlDecoderDestroy(dec);
#undef EXPECT_EQ

#define EXPECT_TRUE(a)  \
  if (!(a)) {           \
    return val::null(); \
  }

  std::unique_ptr<uint8_t[]> pixels(new uint8_t[info.xsize * info.ysize * 4]);
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
      &jxl_profile, pixels.get(), skcms_PixelFormat_RGBA_8888, skcms_AlphaFormat_Unpremul,
      skcms_sRGB_profile(), info.xsize * info.ysize));

  return ImageData.new_(
      Uint8ClampedArray.new_(typed_memory_view(info.xsize * info.ysize * 4, pixels.get())),
      info.xsize, info.ysize);
}

EMSCRIPTEN_BINDINGS(my_module) {
  function("decode", &decode);
}
