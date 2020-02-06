# AVIF encoder

- Source: <https://github.com/AOMediaCodec/libavif>
- Version: v0.5.4

## Example

Run example.js

## API

### `RawImage decode(std::string buffer)`

Decodes the given avif buffer into raw RGBA. `RawImage` is a class with 3 fields: `buffer`, `width`, and `height`.

### `void free_result()`

Frees the result created by `decode()`.
