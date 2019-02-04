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
test -n "$SKIP_LIBWEBP" || (
  cd node_modules/libwebp
  autoreconf -fiv
  rm -rf build || true
  mkdir -p build && cd build
  emconfigure ../configure \
    --disable-libwebpdemux \
    --disable-wic \
    --disable-gif \
    --disable-tiff \
    --disable-jpeg \
    --disable-png \
    --disable-sdl \
    --disable-gl \
    --disable-threading \
    --disable-neon-rtcd \
    --disable-neon \
    --disable-sse2 \
    --disable-sse4.1
  emmake make
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
    -s 'EXPORT_NAME="webp_enc"' \
    --std=c++11 \
    -I node_modules/libwebp \
    -o ./webp_enc.js \
    -x c++ \
    webp_enc.cpp \
    node_modules/libwebp/build/src/.libs/libwebp.a
)
echo "============================================="
echo "Compiling wasm bindings done"
echo "============================================="

echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
echo "Did you update your docker image?"
echo "Run \`docker pull trzeci/emscripten\`"
echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
