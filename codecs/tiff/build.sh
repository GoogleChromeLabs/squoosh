#!/bin/bash
set -euo pipefail

docker build -t squoosh-wasi --network=host -f wasi.Dockerfile .
docker run -it --rm -v "$(pwd)":/src -u "$(id -u):$(id -g)" squoosh-wasi "$@"

# wasm2wat --enable-annotation --enable-code-metadata dec/tiff_dec.wasm > dec/tiff_dec.wat || true
wasm-opt -O3 --strip-debug -o dec/tiff_dec.wasm dec/tiff_dec.wasm
