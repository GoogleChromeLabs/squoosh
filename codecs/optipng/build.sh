#!/bin/bash

set -e

export OPTIMIZE="-Os"
export PREFIX="/src/build"

echo "============================================="
echo "Compiling optipng"
echo "============================================="
(
  cd node_modules/optipng
  CFLAGS="${OPTIMIZE} -Isrc/zlib" emconfigure ./configure --prefix=${PREFIX}
  emmake make
  emmake make install
  mkdir -p ${PREFIX}/lib
  mv ${PREFIX}/bin/optipng ${PREFIX}/lib/liboptipng.so
)
echo "============================================="
echo "Compiling optipng done"
echo "============================================="

echo "============================================="
echo "Compiling optipng wrapper"
echo "============================================="
(
  emcc \
    --bind \
    ${OPTIMIZE} \
    -s ALLOW_MEMORY_GROWTH=1 -s MODULARIZE=1 -s 'EXPORT_NAME="optipng"' \
    -o "optipng.js" \
    --std=c++11 \
    optipng.cpp \
    ${PREFIX}/lib/liboptipng.so
)
echo "============================================="
echo "Compiling optipng wrapper done"
echo "============================================="

echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
echo "Did you update your docker image?"
echo "Run \`docker pull trzeci/emscripten-upstream\`"
echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
