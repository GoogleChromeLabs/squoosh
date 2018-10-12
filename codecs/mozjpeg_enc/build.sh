#!/bin/bash

set -e

export OPTIMIZE="-Os"
export LDFLAGS="${OPTIMIZE}"
export CFLAGS="${OPTIMIZE}"
export CPPFLAGS="${OPTIMIZE}"

apt-get update
apt-get install -qqy autoconf libtool libpng-dev pkg-config

echo "============================================="
echo "Compiling mozjpeg"
echo "============================================="
(
  cd node_modules/mozjpeg
  autoreconf -fiv
  emconfigure ./configure --without-simd
  emmake make libjpeg.la
)
echo "============================================="
echo "Compiling mozjpeg done"
echo "============================================="

echo "============================================="
echo "Compiling wasm bindings"
echo "============================================="
(
  emcc \
    --bind \
    ${OPTIMIZE} \
    -s WASM=1 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MODULARIZE=1 \
    -s 'EXPORT_NAME="mozjpeg_enc"' \
    -I node_modules/mozjpeg \
    -o ./mozjpeg_enc.js \
    -Wno-deprecated-register \
    -Wno-writable-strings \
    node_modules/mozjpeg/rdswitch.c \
    -x c++ -std=c++11 \
    mozjpeg_enc.cpp \
    node_modules/mozjpeg/.libs/libjpeg.a
)
echo "============================================="
echo "Compiling wasm bindings done"
echo "============================================="

echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
echo "Did you update your docker image?"
echo "Run \`docker pull trzeci/emscripten\`"
echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
