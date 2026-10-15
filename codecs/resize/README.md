# Resize

- Source: <https://github.com/Cykooz/fast_image_resize>
- Version: v6.1.0
- License: MIT OR Apache-2.0

Replaced [`resize`](https://github.com/PistonDevelopers/resize) (v0.5.5), which
had no SIMD support. `fast_image_resize` ships hand-written wasm32 SIMD128
kernels for the convolution and alpha multiply/divide inner loops, which is
worth ~6.5x on an 8-bit resize. See `build.sh` for why `+simd128` is
load-bearing, and `src/lib.rs` for why the linear-light path resizes planar.
