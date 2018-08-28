#include "emscripten/bind.h"
#include "emscripten/val.h"

#include <stdio.h>

using namespace emscripten;

extern "C" int process_files(int argc, char *argv[]);

int version() {
  // FIXME (@surma): Haven’t found a version in optipng :(
  return 0;
}

uint8_t* result;
val compress(std::string png) {
  FILE* infile = fopen("input.png", "wb");
  fwrite(png.c_str(), png.length(), 1, infile);
  fclose(infile);

  char* args[] = {"optipng", "-o7", "-zm1-9", "input.png", "-out", "output.png"};
  process_files(6, args);

  FILE *outfile = fopen("output.png", "rb");
  int fsize = fseek(outfile, 0, SEEK_END);
  result = (uint8_t*) malloc(fsize);
  fseek(outfile, 0, SEEK_SET);
  fread(result, fsize, 1, outfile);
  return val(typed_memory_view(fsize, result));
}

void free_result() {
  free(result);
}

EMSCRIPTEN_BINDINGS(my_module) {
  function("compress", &compress);
  function("free_result", &free_result);
}
