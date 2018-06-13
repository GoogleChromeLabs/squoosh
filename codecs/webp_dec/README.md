# WebP decoder

- Source: <https://github.com/webmproject/libwebp>
- Version: v0.6.1

## Example

See `example.html`

## API

### `int version()`

Returns the version of libwebp as a number. va.b.c is encoded as 0x0a0b0c

### `uint8_t* create_buffer(int size)`

Allocates an buffer for the file data.

### `void destroy_buffer(uint8_t* p)`

Frees a buffer created with `create_buffer`.

### `void decode(uint8_t* img_in, int size)`

Decodes the given webp file into raw RGBA. The result is implicitly stored and can be accessed using the `get_result_*()` functions.

### `void free_result()`

Frees the result created by `decode()`.

### `int get_result_pointer()`

Returns the pointer to the start of the buffer holding the encoded data. Length is width x height x 4 bytes.

### `int get_result_width()`

Returns the width of the image.

### `int get_result_height()`

Returns the height of the image.
