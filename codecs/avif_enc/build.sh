#!/bin/bash

set -e

export OPTIMIZE="-Os"
export LDFLAGS="${OPTIMIZE}"
export CFLAGS="${OPTIMIZE}"
export CPPFLAGS="${OPTIMIZE}"

echo "============================================="
echo "Compiling libaom"
echo "============================================="
test -n "$SKIP_LIBAOM" || (
  cd node_modules/libavif/ext  
  test -d aom || git clone -b v1.0.0-errata1-avif --depth 1 https://aomedia.googlesource.com/aom aom

  cd aom
  mkdir -p build.libavif
  cd build.libavif

  emcmake cmake \
        -DCMAKE_BUILD_TYPE=Release \
        -DENABLE_CCACHE=0 \
        -DAOM_TARGET_CPU=generic \
        -DENABLE_DOCS=0 \
        -DENABLE_TESTS=0 \
        -DCONFIG_ACCOUNTING=1 \
        -DCONFIG_INSPECTION=0 \
        -DCONFIG_MULTITHREAD=0 \
        -DCONFIG_RUNTIME_CPU_DETECT=0 \
        -DCONFIG_WEBM_IO=0 \
        ../

  emmake make
)
echo "============================================="
echo "Compiling libaom done"
echo "============================================="

echo "============================================="
echo "Compiling libavif"
echo "============================================="
test -n "$SKIP_LIBAVIF" || (
  cd node_modules/libavif
  mkdir -p build
  cd build
  emcmake cmake \
    DCMAKE_BUILD_TYPE=Release \
    -DAVIF_CODEC_AOM=1 \
    -DAVIF_LOCAL_AOM=1 \
    ../

  emmake make
)
echo "============================================="
echo "Compiling libavif done"
echo "============================================="

echo "============================================="
echo "Compiling wasm bindings"
echo "============================================="
(
   emcc \
    ${OPTIMIZE} \
    --bind \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MODULARIZE=1 \
    -s 'EXPORT_NAME="avif_enc"' \
    --std=c++11 \
    -I ./node_modules/libavif/include \
    -o ./avif_enc.js \
    -x c++ \
    avif_enc.cpp \
    ./node_modules/libavif/build/libavif.a \
    ./node_modules/libavif/ext/aom/build.libavif/libaom.a
)
echo "============================================="
echo "Compiling wasm bindings done"
echo "============================================="

echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
echo "Did you update your docker image?"
echo "Run \`docker pull trzeci/emscripten\`"
echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
