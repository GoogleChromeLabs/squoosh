#!/bin/bash

set -e

export OPTIMIZE="-Os -flto --llvm-lto 1"
export LDFLAGS="${OPTIMIZE}"
export CFLAGS="${OPTIMIZE}"
export CPPFLAGS="${OPTIMIZE}"

echo "============================================="
echo "Compiling libimagequant"
echo "============================================="
(
  cd node_modules/libimagequant
  emconfigure ./configure --disable-sse
  emmake make static -j`nproc`
)
echo "============================================="
echo "Compiling wasm module"
echo "============================================="
(
  emcc \
    --bind \
    ${OPTIMIZE} \
    --closure 1 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MODULARIZE=1 \
    -s 'EXPORT_NAME="imagequant"' \
    -I node_modules/libimagequant \
    -o ./imagequant.js \
    --std=c++11 \
    imagequant.cpp \
    node_modules/libimagequant/libimagequant.a
)
echo "============================================="
echo "Compiling wasm module done"
echo "============================================="

echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
echo "Did you update your docker image?"
echo "Run \`docker pull trzeci/emscripten-upstream\`"
echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
