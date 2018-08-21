# ImageQuant

- Source: <https://github.com/ImageOptim/libimagequant>
- Version: v2.12.1

## Dependencies

- Docker

## Example

See `example.html`

## API

### `int version()`

Returns the version of libimagequant as a number. va.b.c is encoded as 0x0a0b0c

### `RawImage quantize(std::string buffer, int image_width, int image_height, int numColors, float dithering)`

Quantizes the given images, using at most `numColors`, a value between 2 and 256. `dithering` is a value between 0 and 1 controlling the amount of dithering. `RawImage` is a class with 3 fields: `buffer`, `width`, and `height`.

### `RawImage zx_quantize(std::string buffer, int image_width, int image_height, float dithering)`

???

### `void free_result()`

Frees the result created by `quantize()`.
