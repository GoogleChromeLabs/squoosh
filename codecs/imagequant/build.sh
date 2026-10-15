#!/bin/bash

set -e

# Single build of squoosh-imagequant, with wasm SIMD.
#
# libimagequant was rewritten in Rust for v4, so this is no longer an
# emscripten/C++ codec - there is no C library left to ./configure. It builds
# through codecs/rust.Dockerfile like resize and oxipng do.
#
# The hot loops (k-means refinement, nearest-neighbour palette search, the
# remap) are f32 maths over 4-channel colours, which LLVM auto-vectorises given
# +simd128. The crate has no hand-written SIMD, so unlike resize there are no
# runtime-dispatched kernels to switch on - the flag just lets the optimiser
# use v128 registers.
#
# No threads, as with resize: imagequant's `threads` feature (rayon +
# thread_local, on by default) is disabled in Cargo.toml, which keeps this on
# stable Rust with no -Z build-std, no shared memory, and no thread pool for
# the quantize worker to spin up.
rm -rf pkg

RUSTFLAGS="-C target-feature=+simd128" \
  wasm-pack build -t web . -- --locked

rm pkg/.gitignore
