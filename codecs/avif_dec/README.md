# WebP decoder

- Source: <https://github.com/webmproject/libwebp>
- Version: v1.0.2

## Example

See `example.html`

## API

### `int version()`

Returns the version of libwebp as a number. va.b.c is encoded as 0x0a0b0c

### `RawImage decode(std::string buffer)`

Decodes the given webp buffer into raw RGBA. `RawImage` is a class with 3 fields: `buffer`, `width`, and `height`.

### `void free_result()`

Frees the result created by `decode()`.
