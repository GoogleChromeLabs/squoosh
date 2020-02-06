# JPEG XL decoder

- Source: <https://gitlab.com/wg1/jpeg-xl>
- Version: ???

## Example

See `example.html`

## API

### `RawImage decode(std::string buffer)`

Decodes the given avif buffer into raw RGBA. `RawImage` is a class with 3 fields: `buffer`, `width`, and `height`.

### `void free_result()`

Frees the result created by `decode()`.
