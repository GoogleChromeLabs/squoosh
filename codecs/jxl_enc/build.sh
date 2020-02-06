#!/bin/bash

set -e

export OPTIMIZE="-Os"
export LDFLAGS="${OPTIMIZE}"
export CFLAGS="${OPTIMIZE}"
export CPPFLAGS="${OPTIMIZE}"

echo "============================================="
echo "Downloading libjxl"
echo "============================================="
test -d node_modules/jxl || (
  cd node_modules
  git clone --recursive https://gitlab.com/wg1/jpeg-xl.git jxl
)
echo "============================================="
echo "Downloading libjxl done"
echo "============================================="

echo "============================================="
echo "Compiling libjxl"
echo "============================================="

test -n "$SKIP_LIBJXL" || (
  cd node_modules/jxl
  git submodule update --init --recursive
  mkdir -p build
  cd build
  emcmake cmake ../
  emmake make jpegxl-static 
)

echo "============================================="
echo "Compiling libjxl done"
echo "============================================="

echo "============================================="
echo "Compiling wasm bindings"
echo "============================================="

emcc \
    ${OPTIMIZE} \
    --bind \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MODULARIZE=1 \
    -s 'EXPORT_NAME="jxl_enc"' \
    -I ./node_modules/jxl \
    -I ./node_modules/jxl/include \
    -I ./node_modules/jxl/third_party/brunsli \
    -I ./node_modules/jxl/third_party/brunsli/c/include \
    -I ./node_modules/jxl/third_party/highway \
    -o ./jxl_enc.js \
    -x c++ \
    --std=c++11 \
    jxl_enc.cpp \
    ./node_modules/jxl/build/libjpegxl-static.bc \
    ./node_modules/jxl/build/third_party/brunsli/libbrunslienc-static.bc \
    ./node_modules/jxl/build/third_party/brunsli/libbrunslidec-static.bc \
    ./node_modules/jxl/build/third_party/brunsli/libbrunslicommon-static.bc \
    ./node_modules/jxl/build/third_party/brotli/libbrotlienc-static.bc \
    ./node_modules/jxl/build/third_party/brotli/libbrotlidec-static.bc \
    ./node_modules/jxl/build/third_party/brotli/libbrotlicommon-static.bc \
    ./node_modules/jxl/build/third_party/liblcms2.bc \
    ./node_modules/jxl/build/third_party/highway/libhwy.bc

echo "============================================="
echo "Compiling wasm bindings done"
echo "============================================="

echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
echo "Did you update your docker image?"
echo "Run \`docker pull trzeci/emscripten\`"
echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
