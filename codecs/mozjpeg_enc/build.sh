#!/bin/bash

set -e

export OPTIMIZE="-Os -flto --llvm-lto 1"
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
  autoreconf -iv
  emconfigure ./configure -C --without-simd
  emmake make libjpeg.la rdswitch.o -j`nproc`
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
    --closure 1 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MODULARIZE=1 \
    -s 'EXPORT_NAME="mozjpeg_enc"' \
    -I node_modules/mozjpeg \
    -o ./mozjpeg_enc.js \
    -std=c++11 \
    mozjpeg_enc.cpp \
    node_modules/mozjpeg/.libs/libjpeg.a \
    node_modules/mozjpeg/rdswitch.o
)
echo "============================================="
echo "Compiling wasm bindings done"
echo "============================================="

echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
echo "Did you update your docker image?"
echo "Run \`docker pull trzeci/emscripten-upstream\`"
echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
