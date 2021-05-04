#!/bin/sh -e
docker build -t squoosh-wasi-sdk - < ../wasi-sdk.Dockerfile
docker run -it --rm -v $PWD:/src squoosh-wasi-sdk "$@"
