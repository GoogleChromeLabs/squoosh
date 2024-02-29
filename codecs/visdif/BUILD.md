This codec currently needs monkey-patching of Emscripten

```
$ docker run --rm -it -v $(PWD):/src squoosh-cpp "/bin/bash"
# cat << EOF | patch /emsdk/upstream/emscripten/system/lib/dlmalloc.c
659c659
< #define MALLOC_ALIGNMENT ((size_t)(2 * sizeof(void *)))
---
> #define MALLOC_ALIGNMENT ((size_t)(16U))
EOF
# emcc --clear-cache
# /emsdk/upstream/emscripten/embuilder build libdlmalloc --force
# emmake make
```