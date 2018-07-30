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

### `uint8_t* create_buffer(int width, int height)`

Allocates an RGBA buffer for an image with the given dimension.

### `void destroy_buffer(uint8_t* p)`

Frees a buffer created with `create_buffer`.

### `void quantize(uint8_t* image_buffer, int image_width, int image_height, int numColors, float dithering)`

Quantizes the given images, using at most `numColors`, a value between 2 and 256. `dithering` is a value between 0 and 1 controlling the amount of dithering.

### `void free_result()`

Frees the result created by `encode()`.

### `int get_result_pointer()`

Returns the pointer to the start of the buffer holding the encoded data. It has the same size as the input image buffer.
