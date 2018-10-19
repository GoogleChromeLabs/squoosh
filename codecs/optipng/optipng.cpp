#include "emscripten/bind.h"
#include "emscripten/val.h"

#include <stdio.h>

using namespace emscripten;

extern "C" int main(int argc, char *argv[]);

int version() {
  // FIXME (@surma): Haven’t found a version in optipng :(
  return 0;
}

struct OptiPngOpts {
  int level;
};

uint8_t* result;
val compress(std::string png, OptiPngOpts opts) {
  remove("input.png");
  remove("output.png");
  FILE* infile = fopen("input.png", "wb");
  fwrite(png.c_str(), png.length(), 1, infile);
  fflush(infile);
  fclose(infile);

  char optlevel[8];
  sprintf(&optlevel[0], "-o%d", opts.level);
  char* args[] = {"optipng", optlevel, "-out", "output.png", "input.png"};
  main(5, args);

  FILE *outfile = fopen("output.png", "rb");
  fseek(outfile, 0, SEEK_END);
  int fsize = ftell(outfile);
  result = (uint8_t*) malloc(fsize);
  fseek(outfile, 0, SEEK_SET);
  fread(result, fsize, 1, outfile);
  return val(typed_memory_view(fsize, result));
}

void free_result() {
  free(result);
}

EMSCRIPTEN_BINDINGS(my_module) {
  value_object<OptiPngOpts>("OptiPngOpts")
    .field("level", &OptiPngOpts::level);

  function("version", &version);
  function("compress", &compress);
  function("free_result", &free_result);
}
