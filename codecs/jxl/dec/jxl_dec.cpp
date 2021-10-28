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

#ifndef JXL_DEBUG_ON_ALL_ERROR
#define JXL_DEBUG_ON_ALL_ERROR 0
#endif

#if JXL_DEBUG_ON_ALL_ERROR
#define EXPECT_TRUE(a)                                             \
  if (!(a)) {                                                      \
    fprintf(stderr, "Assertion failure (%d): %s\n", __LINE__, #a); \
    return val::null();                                            \
  }
#define EXPECT_EQ(a, b)                                                                          \
  {                                                                                              \
    int a_ = a;                                                                                  \
    int b_ = b;                                                                                  \
    if (a_ != b_) {                                                                              \
      fprintf(stderr, "Assertion failure (%d): %s (%d) != %s (%d)\n", __LINE__, #a, a_, #b, b_); \
      return val::null();                                                                        \
    }                                                                                            \
  }
#else
#define EXPECT_TRUE(a)  \
  if (!(a)) {           \
    return val::null(); \
  }

#define EXPECT_EQ(a, b) EXPECT_TRUE((a) == (b));
#endif

val decode(std::string data) {
  std::unique_ptr<JxlDecoder,
                  std::integral_constant<decltype(&JxlDecoderDestroy), JxlDecoderDestroy>>
      dec(JxlDecoderCreate(nullptr));
  EXPECT_EQ(JXL_DEC_SUCCESS,
            JxlDecoderSubscribeEvents(
                dec.get(), JXL_DEC_BASIC_INFO | JXL_DEC_COLOR_ENCODING | JXL_DEC_FULL_IMAGE));

  auto next_in = (const uint8_t*)data.c_str();
  auto avail_in = data.size();
  JxlDecoderSetInput(dec.get(), next_in, avail_in);
  EXPECT_EQ(JXL_DEC_BASIC_INFO, JxlDecoderProcessInput(dec.get()));
  JxlBasicInfo info;
  EXPECT_EQ(JXL_DEC_SUCCESS, JxlDecoderGetBasicInfo(dec.get(), &info));
  size_t pixel_count = info.xsize * info.ysize;
  size_t component_count = pixel_count * COMPONENTS_PER_PIXEL;

  EXPECT_EQ(JXL_DEC_COLOR_ENCODING, JxlDecoderProcessInput(dec.get()));
  static const JxlPixelFormat format = {COMPONENTS_PER_PIXEL, JXL_TYPE_FLOAT, JXL_LITTLE_ENDIAN, 0};
  size_t icc_size;
  EXPECT_EQ(JXL_DEC_SUCCESS, JxlDecoderGetICCProfileSize(dec.get(), &format,
                                                         JXL_COLOR_PROFILE_TARGET_DATA, &icc_size));
  std::vector<uint8_t> icc_profile(icc_size);
  EXPECT_EQ(JXL_DEC_SUCCESS,
            JxlDecoderGetColorAsICCProfile(dec.get(), &format, JXL_COLOR_PROFILE_TARGET_DATA,
                                           icc_profile.data(), icc_profile.size()));

  EXPECT_EQ(JXL_DEC_NEED_IMAGE_OUT_BUFFER, JxlDecoderProcessInput(dec.get()));
  size_t buffer_size;
  EXPECT_EQ(JXL_DEC_SUCCESS, JxlDecoderImageOutBufferSize(dec.get(), &format, &buffer_size));
  EXPECT_EQ(buffer_size, component_count * sizeof(float));

  auto float_pixels = std::make_unique<float[]>(component_count);
  EXPECT_EQ(JXL_DEC_SUCCESS, JxlDecoderSetImageOutBuffer(dec.get(), &format, float_pixels.get(),
                                                         component_count * sizeof(float)));
  EXPECT_EQ(JXL_DEC_FULL_IMAGE, JxlDecoderProcessInput(dec.get()));

  auto byte_pixels = std::make_unique<uint8_t[]>(component_count);
  // Convert to sRGB.
  skcms_ICCProfile jxl_profile;
  EXPECT_TRUE(skcms_Parse(icc_profile.data(), icc_profile.size(), &jxl_profile));
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
