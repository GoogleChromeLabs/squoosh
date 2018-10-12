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
  emcc \
    ${OPTIMIZE} \
    -Wno-implicit-function-declaration \
    -I ${PREFIX}/include \
    -I node_modules/optipng/src/opngreduc \
    -I node_modules/optipng/src/pngxtern \
    -I node_modules/optipng/src/cexcept \
    -I node_modules/optipng/src/gifread \
    -I node_modules/optipng/src/pnmio \
    -I node_modules/optipng/src/minitiff \
    --std=c99 -c \
    node_modules/optipng/src/opngreduc/*.c \
    node_modules/optipng/src/pngxtern/*.c \
    node_modules/optipng/src/gifread/*.c \
    node_modules/optipng/src/minitiff/*.c \
    node_modules/optipng/src/pnmio/*.c \
    node_modules/optipng/src/optipng/*.c

  emcc \
    --bind \
    ${OPTIMIZE} \
    -s ALLOW_MEMORY_GROWTH=1 -s MODULARIZE=1 -s 'EXPORT_NAME="optipng"' \
    -I ${PREFIX}/include \
    -I node_modules/optipng/src/opngreduc \
    -I node_modules/optipng/src/pngxtern \
    -I node_modules/optipng/src/cexcept \
    -I node_modules/optipng/src/gifread \
    -I node_modules/optipng/src/pnmio \
    -I node_modules/optipng/src/minitiff \
    -o "optipng.js" \
    --std=c++11 \
    optipng.cpp \
    *.o \
    ${PREFIX}/lib/libz.so ${PREFIX}/lib/libpng.a
)
echo "============================================="
echo "Compiling optipng done"
echo "============================================="

echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
echo "Did you update your docker image?"
echo "Run \`docker pull trzeci/emscripten\`"
echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
