#!/bin/sh -e
docker build -t squoosh-rust-emscripten - < ../rust-emscripten.Dockerfile
docker run -it --rm \
  ${DEBUG_BUILD:+-e DEBUG_BUILD=$DEBUG_BUILD} \
  -v $PWD:/src squoosh-rust-emscripten "$@"
