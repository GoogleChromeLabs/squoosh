#!/bin/bash

set -e

echo "============================================="
echo "Compiling wasm"
echo "============================================="
(
  export CC=/opt/wasi-sdk/bin/clang
  rm -rf pkg,{-parallel}
  wasm-pack build -t web
  RUSTFLAGS='-C target-feature=+atomics,+bulk-memory' wasm-pack build -t web -d pkg-parallel -- -Z build-std=panic_abort,std --features=parallel
  sed -i "s|input = import.meta.url.replace(/\\\.js$/, '_bg.wasm');||" pkg{,-parallel}/oxipng.js
  rm pkg{,-parallel}/.gitignore
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
