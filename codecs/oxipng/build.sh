#!/bin/bash

set -e

rm -rf pkg pkg-parallel
export CFLAGS="${CFLAGS} -DUNALIGNED_ACCESS_IS_FAST=1"
wasm-pack build -t web
# Threads need shared memory, which current Rust only produces with these
# linker flags (see the wasm-bindgen-rayon README).
RUSTFLAGS='-C target-feature=+atomics,+bulk-memory
  -C link-arg=--shared-memory -C link-arg=--max-memory=2147483648 -C link-arg=--import-memory
  -C link-arg=--export=__wasm_init_tls -C link-arg=--export=__tls_size
  -C link-arg=--export=__tls_align -C link-arg=--export=__tls_base' \
  wasm-pack build -t web -d pkg-parallel . -- -Z build-std=panic_abort,std --features=parallel
rm pkg{,-parallel}/.gitignore
