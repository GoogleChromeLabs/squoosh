# MozJPEG encoder

- Source: <https://github.com/mozilla/mozjpeg>
- Version: v3.3.1

## Example

See `example.html`

## API

### `int version()`

Returns the version of MozJPEG as a number. va.b.c is encoded as 0x0a0b0c

### `uint8_t* create_buffer(int width, int height)`

Allocates an RGBA buffer for an image with the given dimension.

### `void destroy_buffer(uint8_t* p)`

Frees a buffer created with `create_buffer`.

### `void encode(uint8_t* image_buffer, int image_width, int image_height, int quality)`

Encodes the given image with given dimension to JPEG. `quality` is a number between 0 and 100. The higher the number, the better the quality of the encoded image. The result is implicitly stored and can be accessed using the `get_result_*()` functions.

### `void free_result()`

Frees the result created by `encode()`.

### `int get_result_pointer()`

Returns the pointer to the start of the buffer holding the encoded data.

### `int get_result_size()`

Returns the length of the buffer holding the encoded data.
