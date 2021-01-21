#!/bin/bash

set -e

rm -rf pkg,{-parallel}
export CFLAGS="${CFLAGS} -DUNALIGNED_ACCESS_IS_FAST=1"
wasm-pack build -t web -- --locked
RUSTFLAGS='-C target-feature=+atomics,+bulk-memory' wasm-pack build -t web -d pkg-parallel -- -Z build-std=panic_abort,std --features=parallel --locked
# Workaround https://github.com/rustwasm/wasm-bindgen/issues/2133:
sed -i "s|maybe_memory:|maybe_memory?:|" pkg-parallel/squoosh_oxipng.d.ts
# Workaround wasm-pack using a very old wasm-opt.
echo "Optimizing wasm binaries with \`wasm-opt\`..."
wasm-opt -O pkg/squoosh_oxipng_bg.wasm -o pkg/squoosh_oxipng_bg.wasm
wasm-opt -O pkg-parallel/squoosh_oxipng_bg.wasm -o pkg-parallel/squoosh_oxipng_bg.wasm
rm pkg{,-parallel}/.gitignore
