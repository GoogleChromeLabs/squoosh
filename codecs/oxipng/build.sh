#!/bin/bash

set -e

rm -rf pkg,{-parallel}
wasm-pack build -t web
RUSTFLAGS='-C target-feature=+atomics,+bulk-memory' wasm-pack build -t web -d pkg-parallel -- -Z build-std=panic_abort,std --features=parallel
# Workaround https://github.com/rustwasm/wasm-bindgen/issues/2133:
sed -i "s|maybe_memory:|maybe_memory?:|" pkg-parallel/squoosh_oxipng.d.ts
rm pkg{,-parallel}/.gitignore
