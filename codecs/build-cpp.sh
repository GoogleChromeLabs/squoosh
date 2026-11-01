#!/bin/sh -e
docker build -t squoosh-cpp - < ../cpp.Dockerfile
# Only attach a terminal when there is one (not in CI or scripts).
if [ -t 0 ]; then TTY_FLAGS=-it; fi
docker run $TTY_FLAGS --rm -v "$PWD":/src squoosh-cpp "$@"
