#!/bin/bash

set -e

echo "============================================="
echo "Compiling wasm"
echo "============================================="
(
  rustup run nightly \
    rustc \
    --target=wasm32-unknown-unknown \
    -C opt-level=3 \
    -o rotate.wasm \
    rotate.rs
    wasm-strip rotate.wasm
)
echo "============================================="
echo "Compiling wasm  done"
echo "============================================="

echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
echo "Did you update your docker image?"
echo "Run \`docker build -t squoosh-rotate .\`"
echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
