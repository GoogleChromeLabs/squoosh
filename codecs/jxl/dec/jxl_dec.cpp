#include <emscripten/bind.h>
#include <emscripten/val.h>

#include <memory>

#include <jxl/cms.h>
#include <jxl/decode.h>
// For JxlColorEncodingSetToSRGB, which is declared in the encoder header but
// backed by libjxl.a (which we link).
#include <jxl/encode.h>

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

  // Let libjxl handle colour management and hand us sRGB pixels directly, rather
  // than decoding to float + converting the image's ICC profile ourselves. This
  // drops the skcms dependency, the intermediate float buffer and the manual
  // transform. The CMS must be set before the output colour profile.
  EXPECT_EQ(JXL_DEC_SUCCESS, JxlDecoderSetCms(dec.get(), *JxlGetDefaultCms()));

  // Browser ImageData wants straight (un-premultiplied) alpha. libjxl otherwise
  // returns premultiplied colours as-is for images with associated alpha. Must
  // be set before decoding starts.
  EXPECT_EQ(JXL_DEC_SUCCESS, JxlDecoderSetUnpremultiplyAlpha(dec.get(), JXL_TRUE));

  JxlDecoderSetInput(dec.get(), (const uint8_t*)data.c_str(), data.size());
  EXPECT_EQ(JXL_DEC_BASIC_INFO, JxlDecoderProcessInput(dec.get()));
  JxlBasicInfo info;
  EXPECT_EQ(JXL_DEC_SUCCESS, JxlDecoderGetBasicInfo(dec.get(), &info));
  size_t pixel_count = info.xsize * info.ysize;
  size_t component_count = pixel_count * COMPONENTS_PER_PIXEL;

  // The output colour profile may only be set after the colour-encoding event,
  // and before any later event.
  EXPECT_EQ(JXL_DEC_COLOR_ENCODING, JxlDecoderProcessInput(dec.get()));
  JxlColorEncoding srgb;
  JxlColorEncodingSetToSRGB(&srgb, /*is_gray=*/JXL_FALSE);
  EXPECT_EQ(JXL_DEC_SUCCESS,
            JxlDecoderSetOutputColorProfile(dec.get(), &srgb, /*icc_data=*/nullptr, /*icc_size=*/0));

  const JxlPixelFormat format = {COMPONENTS_PER_PIXEL, JXL_TYPE_UINT8, JXL_LITTLE_ENDIAN, 0};

  EXPECT_EQ(JXL_DEC_NEED_IMAGE_OUT_BUFFER, JxlDecoderProcessInput(dec.get()));
  auto pixels = std::make_unique<uint8_t[]>(component_count);
  EXPECT_EQ(JXL_DEC_SUCCESS,
            JxlDecoderSetImageOutBuffer(dec.get(), &format, pixels.get(), component_count));
  EXPECT_EQ(JXL_DEC_FULL_IMAGE, JxlDecoderProcessInput(dec.get()));

  return ImageData.new_(Uint8ClampedArray.new_(typed_memory_view(component_count, pixels.get())),
                        info.xsize, info.ysize);
}

EMSCRIPTEN_BINDINGS(my_module) {
  function("decode", &decode);
}
