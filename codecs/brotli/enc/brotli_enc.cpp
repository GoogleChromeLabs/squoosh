// Emscripten/Embind wrapper around Google's reference Brotli encoder.
//
// Squoosh uses this to measure, not to produce output: a vector source is
// presented at the size it would be as `Content-Encoding: br`, since that's
// what a browser downloading an SVG actually receives. So the binding returns a
// byte count and throws the compressed bytes away - there is no reason to copy
// a second buffer back out to JS.
//
//   const module = await moduleFactory();
//   const bytes = module.compressed_size(uint8Array);

#include <emscripten/bind.h>

#include <brotli/encode.h>

#include <cstdint>
#include <string>
#include <vector>

using namespace emscripten;

namespace {

// Maximum quality, and the largest window RFC 7932 allows. 24 is therefore also
// the largest a `Content-Encoding: br` decoder is obliged to handle -
// "large-window Brotli" goes further but is an extension browsers don't accept
// over the wire. The window only matters for sources above 4MB, where a smaller
// one would stop finding long-range matches.
constexpr int kQuality = BROTLI_MAX_QUALITY;
constexpr int kWindow = BROTLI_MAX_WINDOW_BITS;

// Embind hands a BufferSource over as std::string.
int compressed_size(const std::string& data) {
  // BrotliEncoderCompress needs somewhere to put the output even though we only
  // want its length. It returns failure rather than growing, so the buffer has
  // to be big enough up front: MaxCompressedSize covers brotli's worst case,
  // which exceeds the input for very small inputs.
  size_t capacity = BrotliEncoderMaxCompressedSize(data.size());
  if (capacity == 0) return -1;

  std::vector<uint8_t> out(capacity);
  size_t size = capacity;

  // The caller only ever hands us SVG, and BROTLI_MODE_TEXT is what a server
  // compressing image/svg+xml would use.
  if (!BrotliEncoderCompress(kQuality, kWindow, BROTLI_MODE_TEXT, data.size(),
                             reinterpret_cast<const uint8_t*>(data.data()),
                             &size, out.data())) {
    return -1;
  }

  return static_cast<int>(size);
}

}  // namespace

EMSCRIPTEN_BINDINGS(brotli_enc_module) {
  function("compressed_size", &compressed_size);
}
