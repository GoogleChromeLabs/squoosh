#!/bin/bash

set -e

echo "============================================="
echo "Compiling wasm"
echo "============================================="
(
  rustup run nightly \
    wasm-pack build --target no-modules
  wasm-strip pkg/resize_bg.wasm
)
echo "============================================="
echo "Compiling wasm  done"
echo "============================================="

echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
echo "Did you update your docker image?"
echo "Run \`docker pull ubuntu\`"
echo "Run \`docker pull rust\`"
echo "Run \`docker build -t squoosh-resize .\`"
echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
