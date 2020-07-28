#!/bin/sh

set -e

cargo build \
  --target wasm32-unknown-unknown \
  --release
wasm-opt -Os --strip target/wasm32-unknown-unknown/release/rotate.wasm -o rotate.wasm
