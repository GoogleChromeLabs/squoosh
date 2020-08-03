#include <emscripten/bind.h>
#include <emscripten/val.h>
#include "avif/avif.h"

using namespace emscripten;

class RawImage {
 public:
  val buffer;
  uint32_t width;
  uint32_t height;

  RawImage(val b, uint32_t w, uint32_t h) : buffer(b), width(w), height(h) {}
};

RawImage decode(std::string avifimage) {
  // point raw.data and raw.size to the contents of an .avif(s)
  avifROData raw;
  raw.data = (uint8_t*)avifimage.c_str();
  raw.size = avifimage.length();

  avifImage* image = avifImageCreateEmpty();
  avifDecoder* decoder = avifDecoderCreate();
  avifResult decodeResult = avifDecoderRead(decoder, image, &raw);
  // image is an independent copy of decoded data, decoder may be destroyed here
  avifDecoderDestroy(decoder);
  if (decodeResult != AVIF_RESULT_OK) {
    return RawImage(val::null(), -1, -1);
  }

  // Convert to interleaved RGB(A)/BGR(A) using a libavif-allocated buffer.
  avifRGBImage rgb;
  avifRGBImageSetDefaults(&rgb, image);  // Defaults to AVIF_RGB_FORMAT_RGBA which is what we want.
  rgb.depth = 8;  // Does not need to match image->depth. We always want 8-bit pixels.

  avifRGBImageAllocatePixels(&rgb);
  avifImageYUVToRGB(image, &rgb);

  // Image has been converted to RGB, we don't need the original anymore.
  avifImageDestroy(image);

  // We want to create a *copy* of the decoded data to be owned by the JavaScript side.
  // For that, we perform `new Uint8Array(wasmMemBuffer, wasmPtr, wasmSize).slice()`:
  auto result = val(typed_memory_view(rgb.rowBytes * rgb.height, rgb.pixels)).call<val>("slice");

  // Now we can safely free the RGB pixels:
  avifRGBImageFreePixels(&rgb);

  return RawImage(result, rgb.width, rgb.height);
}

EMSCRIPTEN_BINDINGS(my_module) {
  class_<RawImage>("RawImage")
      .property("buffer", &RawImage::buffer)
      .property("width", &RawImage::width)
      .property("height", &RawImage::height);

  function("decode", &decode);
}
