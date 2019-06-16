#!/bin/bash

set -e

echo "============================================="
echo "Compiling wasm"
echo "============================================="
(
  rustup run nightly \
    wasm-pack build --target web
  # wasm-strip pkg/squooshhqx_bg.wasm
)
echo "============================================="
echo "Compiling wasm  done"
echo "============================================="

echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
echo "Did you update your docker image?"
echo "Run \`docker pull ubuntu\`"
echo "Run \`docker pull rust\`"
echo "Run \`docker build -t squoosh-hqx .\`"
echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
