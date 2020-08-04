#!/bin/sh -e
docker build -t squoosh-cpp - < ../cpp.Dockerfile
docker run --rm -v $PWD:/src squoosh-cpp
