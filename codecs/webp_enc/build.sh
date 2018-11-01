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
    -D WEBP_USE_THREAD \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s USE_PTHREADS=1 \
    -s ASSERTIONS=1 \
    -s PTHREAD_POOL_SIZE=2 \
    -s TOTAL_MEMORY=268435456 \
    -s WASM_MEM_MAX=268435456 \
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

echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
echo "Did you update your docker image?"
echo "Run \`docker pull trzeci/emscripten\`"
echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
