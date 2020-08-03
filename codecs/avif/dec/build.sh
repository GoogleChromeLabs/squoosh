#!/bin/bash

set -e

export export OPTIMIZE="-Os -flto --llvm-lto 1"
export LDFLAGS="${OPTIMIZE}"
export CFLAGS="${OPTIMIZE}"
export CPPFLAGS="${OPTIMIZE}"

echo "============================================="
echo "Compiling libaom"
echo "============================================="
test -n "$SKIP_LIBAOM" || (
  cd node_modules/libavif/ext/aom
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

  emmake make -j`nproc`
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

  emmake make -j`nproc`
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
    -s 'EXPORT_NAME="avif_dec"' \
    --std=c++11 \
    -I ./node_modules/libavif/include \
    -o ./avif_dec.js \
    -x c++ \
    avif_dec.cpp \
    ./node_modules/libavif/build/libavif.a \
    ./node_modules/libavif/ext/aom/build.libavif/libaom.a
)
echo "============================================="
echo "Compiling wasm bindings done"
echo "============================================="

echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
echo "Did you update your docker image?"
echo "Run \`docker pull trzeci/emscripten-upstream\`"
echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
