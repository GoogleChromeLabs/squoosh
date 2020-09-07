#include <butteraugli/butteraugli.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>

using namespace emscripten;
using namespace butteraugli;

double visdif(std::string rgba1, std::string rgba2, int width, int height) {
  const char* rgba1p = rgba1.c_str();
  const char* rgba2p = rgba2.c_str();
  // One Image8 for each color channel + alpha
  std::vector<ImageF> img1;
  img1.push_back(ImageF(width, height));
  img1.push_back(ImageF(width, height));
  img1.push_back(ImageF(width, height));
  img1.push_back(ImageF(width, height));
  std::vector<ImageF> img2;
  img2.push_back(ImageF(width, height));
  img2.push_back(ImageF(width, height));
  img2.push_back(ImageF(width, height));
  img2.push_back(ImageF(width, height));
  // Convert from interleaved RGBA to separate channels
  for (int y = 0; y < height; y++) {
    float* const img1_row_r = img1[0].Row(y);
    float* const img1_row_g = img1[1].Row(y);
    float* const img1_row_b = img1[2].Row(y);
    float* const img1_row_a = img1[3].Row(y);
    float* const img2_row_r = img2[0].Row(y);
    float* const img2_row_g = img2[1].Row(y);
    float* const img2_row_b = img2[2].Row(y);
    float* const img2_row_a = img2[3].Row(y);
    for (int x = 0; x < width; x++) {
      img1_row_r[x] = 255.0 * pow(rgba1p[y * width * 4 + x * 4 + 0] / 255.0, 2.2);
      img1_row_g[x] = 255.0 * pow(rgba1p[y * width * 4 + x * 4 + 1] / 255.0, 2.2);
      img1_row_b[x] = 255.0 * pow(rgba1p[y * width * 4 + x * 4 + 2] / 255.0, 2.2);
      img1_row_a[x] = 255.0 * pow(rgba1p[y * width * 4 + x * 4 + 3] / 255.0, 2.2);
      img2_row_r[x] = 255.0 * pow(rgba2p[y * width * 4 + x * 4 + 0] / 255.0, 2.2);
      img2_row_g[x] = 255.0 * pow(rgba2p[y * width * 4 + x * 4 + 1] / 255.0, 2.2);
      img2_row_b[x] = 255.0 * pow(rgba2p[y * width * 4 + x * 4 + 2] / 255.0, 2.2);
      img2_row_a[x] = 255.0 * pow(rgba2p[y * width * 4 + x * 4 + 3] / 255.0, 2.2);
    }
  }

  ImageF diffmap;
  double diffvalue;
  if (!ButteraugliInterface(img1, img2, 1.0, diffmap, diffvalue)) {
    return -1.0;
  }
  return diffvalue;
}

EMSCRIPTEN_BINDINGS(my_module) {
  function("visdif", &visdif);
}
