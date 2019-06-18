#!/bin/bash

set -e

echo "============================================="
echo "Compiling wasm"
echo "============================================="
(
  rustup run nightly \
    wasm-pack build --target no-modules
  mv pkg/squooshhqx_bg.wasm pkg/squooshhqx_bg.unopt.wasm
  wasm-opt -Os --no-validation pkg/squooshhqx_bg.unopt.wasm -o pkg/squooshhqx_bg.wasm
  wasm-strip pkg/squooshhqx_bg.wasm
  rm pkg/.gitignore
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
