#!/bin/sh -e
docker build -t squoosh-cpp - < ../cpp.Dockerfile
docker run -it --rm \
  ${DEBUG_BUILD:+-e DEBUG_BUILD=$DEBUG_BUILD} \
  -v $PWD:/src squoosh-cpp "$@"
