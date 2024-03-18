#!/bin/bash

set -e

rm -rf pkg,{-parallel}
export CFLAGS="${CFLAGS} -DUNALIGNED_ACCESS_IS_FAST=1"
wasm-pack build -t web
RUSTFLAGS='-C target-feature=+atomics,+bulk-memory' wasm-pack build -t web -d pkg-parallel . -- -Z build-std=panic_abort,std --features=parallel
rm pkg{,-parallel}/.gitignore
