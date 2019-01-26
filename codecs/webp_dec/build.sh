#!/bin/bash

set -e

export OPTIMIZE="-Os"
export LDFLAGS="${OPTIMIZE}"
export CFLAGS="${OPTIMIZE}"
export CPPFLAGS="${OPTIMIZE}"
apt-get update
apt-get install -qqy autoconf libtool libpng-dev pkg-config

echo "============================================="
echo "Compiling libwebp"
echo "============================================="
(
  cd node_modules/libwebp
  autoreconf -fiv
  emcmake cmake .
  emmake make webp
)
echo "============================================="
echo "Compiling wasm bindings"
echo "============================================="
(
  emcc \
    ${OPTIMIZE} \
    --bind \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MODULARIZE=1 \
    -s 'EXPORT_NAME="webp_dec"' \
    --std=c++11 \
    -I node_modules/libwebp \
    -o ./webp_dec.js \
    -x c++ \
    webp_dec.cpp \
    node_modules/libwebp/libwebp.a
)
echo "============================================="
echo "Compiling wasm bindings done"
echo "============================================="

echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
echo "Did you update your docker image?"
echo "Run \`docker pull trzeci/emscripten\`"
echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
