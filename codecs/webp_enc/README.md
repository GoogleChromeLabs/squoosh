# WebP encoder

- Source: <https://github.com/webmproject/libwebp>
- Version: v1.0.2

## Dependencies

- Docker

## Example

See `example.html`

## API

### `int version()`

Returns the version of libwebp as a number. va.b.c is encoded as 0x0a0b0c

### `UInt8Array encode(uint8_t* image_buffer, int image_width, int image_height, WebPConfig config)`

Encodes the given image with given dimension to WebP.

### `void free_result()`

Frees the last result created by `encode()`.
