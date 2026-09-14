#!/bin/bash

set -e

# Single build of squoosh-oxipng, with wasm threads AND SIMD.
#
# Previously this produced two outputs - `pkg` (baseline) and `pkg-parallel`
# (+atomics,+bulk-memory, rayon) - and the worker feature-detected between them.
# The rest of the app (AVIF, JPEG XL, WebP) is built -pthread and so already
# requires SharedArrayBuffer, meaning a browser that can't run the threaded
# build can't run Squoosh's other codecs either. So the baseline build is gone
# and `pkg` is now the threaded one.
#
# +simd128 lets LLVM auto-vectorise oxipng's filtering and libdeflater's
# scalar C. -Z build-std is needed because the standard library has to be
# recompiled with the atomics/bulk-memory target features (hence the nightly
# toolchain in ./rust-toolchain).
#
# NB: the old script's `rm -rf pkg,{-parallel}` expanded to the single literal
# path `pkg,-parallel`, so it never actually cleaned anything.
rm -rf pkg

# CFLAGS reaches libdeflate's C sources via the cc crate (libdeflate-sys), which
# is oxipng's DEFLATE hot path. The wasm feature flags below live in RUSTFLAGS,
# and RUSTFLAGS only affects *Rust* codegen - so without -msimd128 here the
# compression inner loops stayed scalar while the Rust half got SIMD.
# UNALIGNED_ACCESS_IS_FAST tells libdeflate it can do unaligned loads, which is
# true of wasm.
export CFLAGS="${CFLAGS} -DUNALIGNED_ACCESS_IS_FAST=1 -msimd128"

# --shared-memory / --import-memory / --max-memory must be passed explicitly.
# Enabling the atomics target feature no longer makes rustc infer them, so
# without these the module comes out with a plain `(memory $0 17)` despite
# containing ~1200 atomic ops. wasm-bindgen-rayon's initThreadPool postMessages
# the WebAssembly.Memory to each rayon worker, and a non-shared memory is not
# structured-cloneable - which surfaces in the app as
# "DataCloneError: WebAssembly.Memory object could not be cloned".
# A shared memory must declare a maximum, hence --max-memory. 4 GiB is wasm32's
# addressable ceiling; the memory still grows on demand from its initial size.
RUSTFLAGS="-C target-feature=+atomics,+bulk-memory,+simd128 \
  -C link-arg=--shared-memory \
  -C link-arg=--import-memory \
  -C link-arg=--max-memory=4294967296 \
  -C link-arg=--export=__wasm_init_tls \
  -C link-arg=--export=__tls_size \
  -C link-arg=--export=__tls_align \
  -C link-arg=--export=__tls_base" \
  wasm-pack build -t web . -- \
  -Z build-std=panic_abort,std \
  --features=parallel

rm pkg/.gitignore
