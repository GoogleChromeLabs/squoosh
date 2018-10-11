#!/bin/bash

set -e

export OPTIMIZE="-Os"
export LDFLAGS="${OPTIMIZE}"
export CFLAGS="${OPTIMIZE}"
export CPPFLAGS="${OPTIMIZE}"

echo "============================================="
echo "Compiling wasm bindings"
echo "============================================="
(
  emcc \
    ${OPTIMIZE} \
    --bind \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MODULARIZE=1 \
    -s 'EXPORT_NAME="webp_enc"' \
    --std=c++11 \
    -I node_modules/libwebp \
    -o ./webp_enc.js \
    node_modules/libwebp/src/{dec,dsp,demux,enc,mux,utils}/*.c \
    -x c++ \
    webp_enc.cpp
)
echo "============================================="
echo "Compiling wasm bindings done"
echo "============================================="
