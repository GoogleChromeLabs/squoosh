#include <butteraugli/butteraugli.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>

using namespace emscripten;
using namespace butteraugli;

// Turns an interleaved RGBA buffer into 4 planes for each color channel
void planarize(std::vector<ImageF>& img,
               const uint8_t* rgba,
               int width,
               int height,
               float gamma = 2.2) {
  assert(img.size() == 0);
  img.push_back(ImageF(width, height));
  img.push_back(ImageF(width, height));
  img.push_back(ImageF(width, height));
  img.push_back(ImageF(width, height));
  for (int y = 0; y < height; y++) {
    float* const row_r = img[0].Row(y);
    float* const row_g = img[1].Row(y);
    float* const row_b = img[2].Row(y);
    float* const row_a = img[3].Row(y);
    for (int x = 0; x < width; x++) {
      row_r[x] = 255.0 * pow(rgba[(y * width + x) * 4 + 0] / 255.0, gamma);
      row_g[x] = 255.0 * pow(rgba[(y * width + x) * 4 + 1] / 255.0, gamma);
      row_b[x] = 255.0 * pow(rgba[(y * width + x) * 4 + 2] / 255.0, gamma);
      row_a[x] = 255.0 * pow(rgba[(y * width + x) * 4 + 3] / 255.0, gamma);
    }
  }
}
class VisDiff {
 private:
  std::vector<ImageF> ref_img;
  int width;
  int height;

 public:
  VisDiff(std::string ref_img, int width, int height) {
    planarize(this->ref_img, (uint8_t*)ref_img.c_str(), width, height);
    this->width = width;
    this->height = height;
  }

  double distance(std::string other_img) {
    std::vector<ImageF> img;
    planarize(img, (uint8_t*)other_img.c_str(), width, height);

    ImageF diffmap;
    double diffvalue;
    if (!ButteraugliInterface(ref_img, img, 1.0, diffmap, diffvalue)) {
      return -1.0;
    }
    return diffvalue;
  }
};

EMSCRIPTEN_BINDINGS(my_module) {
  class_<VisDiff>("VisDiff").constructor<std::string, int, int>().function("distance",
                                                                           &VisDiff::distance);
}
