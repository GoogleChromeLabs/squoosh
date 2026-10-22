#!/bin/bash

set -e

# Single build of squoosh-resize, with wasm SIMD.
#
# fast_image_resize ships hand-written wasm32 SIMD128 kernels for the
# convolution and alpha multiply/divide inner loops (src/convolution/*/wasm32.rs,
# src/alpha/*/wasm32.rs) and selects them at runtime via CpuExtensions::Simd128 -
# but only if the target feature is enabled at compile time. Without +simd128 it
# falls back to its scalar path, which is *slower* than the old `resize` crate.
# So this flag is the entire point of the codec swap: an RGBA8 Lanczos3 downscale
# of 4928x3279 -> 852x567 goes ~298ms scalar -> ~32ms with SIMD, vs ~211ms for
# the `resize` crate it replaced.
#
# Unlike codecs/oxipng there are deliberately no threads here. At ~32ms there is
# nothing left worth parallelising, and staying single-threaded keeps this on
# stable Rust: no -Z build-std, no shared memory, and no wasm-bindgen-rayon
# worker pool for the resize worker to spin up.
rm -rf pkg

RUSTFLAGS="-C target-feature=+simd128" \
  wasm-pack build -t web . -- --locked

rm pkg/.gitignore
