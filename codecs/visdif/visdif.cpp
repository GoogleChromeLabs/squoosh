#include <butteraugli/butteraugli.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>

using namespace emscripten;
using namespace butteraugli;

#define GAMMA 2.2

static float SrgbToLinear[256];

inline void gammaLookupTable() {
  SrgbToLinear[0] = 0;
  for (int i = 1; i < 256; ++i) {
    SrgbToLinear[i] = static_cast<float>(255.0 * pow(i / 255.0, GAMMA));
  }
}

// Turns an interleaved RGBA buffer into 4 planes for each color channel
void planarize(std::vector<ImageF>& img, const uint8_t* rgba, int width, int height) {
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
      row_r[x] = SrgbToLinear[rgba[(y * width + x) * 4 + 0]];
      row_g[x] = SrgbToLinear[rgba[(y * width + x) * 4 + 1]];
      row_b[x] = SrgbToLinear[rgba[(y * width + x) * 4 + 2]];
      row_a[x] = SrgbToLinear[rgba[(y * width + x) * 4 + 3]];
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
    gammaLookupTable();
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
