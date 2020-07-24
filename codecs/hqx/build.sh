#!/bin/bash

set -e

echo "============================================="
echo "Compiling wasm"
echo "============================================="
(
  wasm-pack build
  wasm-strip pkg/squooshhqx_bg.wasm
  echo "Optimising Wasm so it doesn't break Chrome (this takes like 10-15mins. get a cup of tea)"
  echo "Once https://crbug.com/974804 is fixed, we can remove this step"
  wasm-opt -Os --no-validation -o pkg/squooshhqx_bg.wasm pkg/squooshhqx_bg.wasm
  rm pkg/.gitignore
)
echo "============================================="
echo "Compiling wasm  done"
echo "============================================="

echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
echo "Did you update your docker image?"
echo "Run \`docker pull ubuntu\`"
echo "Run \`docker pull rust\`"
echo "Run \`docker build -t squoosh-hqx .\`"
echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
