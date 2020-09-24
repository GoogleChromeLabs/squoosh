#!/bin/bash

set -e

rm -rf pkg,{-parallel}
wasm-pack build -t web
RUSTFLAGS='-C target-feature=+atomics,+bulk-memory' wasm-pack build -t web -d pkg-parallel -- -Z build-std=panic_abort,std --features=parallel
sed -i "s|input = import.meta.url.replace(/\\\.js$/, '_bg.wasm');||" pkg{,-parallel}/squoosh_oxipng.js
rm pkg{,-parallel}/.gitignore
