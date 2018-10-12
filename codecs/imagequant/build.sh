#!/bin/bash

set -e

export OPTIMIZE="-Os"
export LDFLAGS="${OPTIMIZE}"
export CFLAGS="${OPTIMIZE}"
export CPPFLAGS="${OPTIMIZE}"

echo "============================================="
echo "Compiling libimagequant"
echo "============================================="
(
  emcc \
    --bind \
    ${OPTIMIZE} \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MODULARIZE=1 \
    -s 'EXPORT_NAME="imagequant"' \
    -I node_modules/libimagequant \
    --std=c99 \
    -c \
    node_modules/libimagequant/{libimagequant,pam,mediancut,blur,mempool,kmeans,nearest}.c
)
echo "============================================="
echo "Compiling wasm module"
echo "============================================="
(
  emcc \
    --bind \
    ${OPTIMIZE} \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MODULARIZE=1 \
    -s 'EXPORT_NAME="imagequant"' \
    -I node_modules/libimagequant \
    -o ./imagequant.js \
    --std=c++11 *.o \
    -x c++ \
    imagequant.cpp
)
echo "============================================="
echo "Compiling wasm module done"
echo "============================================="

echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
echo "Did you update your docker image?"
echo "Run \`docker pull trzeci/emscripten\`"
echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
