# MozJPEG encoder

- Source: <https://github.com/mozilla/mozjpeg>
- Version: v3.3.1

## Dependencies

- Docker

## Example

See `example.html`

## API

### `int version()`

Returns the version of MozJPEG as a number. va.b.c is encoded as 0x0a0b0c

### `void free_result()`

Frees the result created by `encode()`.

### `Uint8Array encode(std::string image_in, int image_width, int image_height, MozJpegOptions opts)`

Encodes the given image with given dimension to JPEG. Options looks like this:

```c++
struct MozJpegOptions {
  int quality;
  bool baseline;
  bool arithmetic;
  bool progressive;
  bool optimize_coding;
  int smoothing;
  int color_space;
  int quant_table;
  bool trellis_multipass;
  bool trellis_opt_zero;
  bool trellis_opt_table;
  int trellis_loops;
  bool auto_subsample;
  int chroma_subsample;
  bool separate_chroma_quality;
  int chroma_quality;
};
```
