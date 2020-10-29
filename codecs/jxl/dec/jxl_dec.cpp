#include <emscripten/bind.h>
#include <emscripten/val.h>

#include <jpegxl/decode.h>

using namespace emscripten;

thread_local const val Uint8ClampedArray = val::global("Uint8ClampedArray");
thread_local const val ImageData = val::global("ImageData");

#define EXPECT_EQ(a, b) if ((a) != (b)) { JpegxlDecoderDestroy(dec); return val::null(); }

val decode(std::string data) {
  JpegxlDecoder* dec = JpegxlDecoderCreate(nullptr);
  EXPECT_EQ(JPEGXL_DEC_SUCCESS, JpegxlDecoderSubscribeEvents(dec, JPEGXL_DEC_BASIC_INFO | JPEGXL_DEC_FULL_IMAGE));
  auto next_in = (const uint8_t*)data.c_str();
  auto avail_in = data.size();
  EXPECT_EQ(JPEGXL_DEC_BASIC_INFO, JpegxlDecoderProcessInput(dec, &next_in, &avail_in));
  size_t buffer_size;
  const JpegxlPixelFormat format = {4, JPEGXL_LITTLE_ENDIAN, JPEGXL_TYPE_UINT8};
  EXPECT_EQ(JPEGXL_DEC_SUCCESS, JpegxlDecoderImageOutBufferSize(dec, &format, &buffer_size));
  JpegxlBasicInfo info;
  EXPECT_EQ(JPEGXL_DEC_SUCCESS, JpegxlDecoderGetBasicInfo(dec, &info));
  std::vector<uint8_t> pixels(buffer_size);
  EXPECT_EQ(JPEGXL_DEC_SUCCESS, JpegxlDecoderSetImageOutBuffer(dec, &format, pixels.data(), pixels.size()));
  EXPECT_EQ(JPEGXL_DEC_FULL_IMAGE, JpegxlDecoderProcessInput(dec, &next_in, &avail_in));
  JpegxlDecoderDestroy(dec);
  return ImageData.new_(Uint8ClampedArray.new_(typed_memory_view(pixels.size(), pixels.data())), info.xsize, info.ysize);
}

EMSCRIPTEN_BINDINGS(my_module) {
  function("decode", &decode);
}
