# AVIF encoder

- Source: <https://github.com/AOMediaCodec/libavif>
- Version: v0.5.4

## Example

Run example.js

## API

### `Uint8Array encode(std::string image_in, int image_width, int image_height, AvifOptions opts)`

Encodes the given image with given dimension to AVIF. Options looks like this:

```c++
struct AvifOptions {
  // [0 - 100]
  // 0 = worst quality
  // 100 = lossless
  int quality;
  // As above, but -1 means 'use quality'
  int qualityAlpha;
  // [0 - 6]
  // Creates 2^n tiles in that dimension
  int tileRowsLog2;
  int tileColsLog2;
  // [0 - 10]
  // 0 = slowest
  // 10 = fastest
  int speed;
  // 0 = 4:0:0
  // 1 = 4:2:0
  // 2 = 4:2:2
  // 3 = 4:4:4
  int subsample;
  // Extra chroma compression
  bool chromaDeltaQ;
  // 0-7
  int sharpness;
  // 0 = auto
  // 1 = PSNR
  // 2 = SSIM
  int tune;
  // 0-50
  int denoiseLevel;
  // toggles AVIF_CHROMA_DOWNSAMPLING_SHARP_YUV
  bool enableSharpYUV;
};
```
