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
  // 0 = lossless
  // 63 = worst quality
  int minQuantizer;
  int maxQuantizer;

  // [0 - 6]
  // Creates 2^n tiles in that dimension
  int tileRowsLog2;
  int tileColsLog2;

  // 0 = slowest
  // 10 = fastest
  int speed;

  // 0 = 4:2:0
  // 1 = 4:2:2
  // 2 = 4:4:4
  int subsample;
};
```
