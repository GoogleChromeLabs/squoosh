#!/bin/bash

set -e

export OPTIMIZE="-Os"
export PREFIX="/src/build"
export CFLAGS="${OPTIMIZE} -I${PREFIX}/include/"
export CPPFLAGS="${OPTIMIZE} -I${PREFIX}/include/"
export LDFLAGS="${OPTIMIZE} -L${PREFIX}/lib/"

apt-get update
apt-get install -qqy autoconf libtool

echo "============================================="
echo "Compiling zlib"
echo "============================================="
test -n "$SKIP_ZLIB" || (
  cd node_modules/zlib
  emconfigure ./configure --prefix=${PREFIX}/
  emmake make
  emmake make install
)
echo "============================================="
echo "Compiling zlib done"
echo "============================================="

echo "============================================="
echo "Compiling libpng"
echo "============================================="
test -n "$SKIP_LIBPNG" || (
  cd node_modules/libpng
  autoreconf -i
  emconfigure ./configure --with-zlib-prefix=${PREFIX}/ --prefix=${PREFIX}/
  emmake make
  emmake make install
)
echo "============================================="
echo "Compiling libpng done"
echo "============================================="

echo "============================================="
echo "Compiling optipng"
echo "============================================="
(
  cd node_modules/optipng
  emconfigure ./configure --prefix=${PREFIX} --with-system-libs
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
