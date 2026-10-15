# ImageQuant

- Source: <https://github.com/ImageOptim/libimagequant>
- Version: v4.4.1
- License: GPL-3.0-or-later (dual-licensed; see <https://pngquant.org> for the
  commercial option)

libimagequant was rewritten in Rust for v4, so this is no longer an
emscripten/C++ codec — it builds through `codecs/rust.Dockerfile` like `resize`
and `oxipng`. `imagequant.cpp` is gone; `src/lib.rs` is the equivalent,
including a port of the ZX Spectrum block quantizer.

## Modes

- **Rgba** — ordinary palette quantization.
- **AlphaOnly** — quantizes only the alpha channel, passing colour through
  untouched. For lossy WebP, which DCTs the colour anyway but stores alpha
  losslessly. Note that **dithering works against this mode**: the added noise
  can make the alpha plane compress worse than the unquantized original.
- **Zx** — ???
