# OptiPNG

- Source: <http://optipng.sourceforge.net/>
- Version: v0.7.7

## Dependencies

- Docker

## Example

See `example.html`

## API

### `int version()`

Returns the version of optipng as a number. va.b.c is encoded as 0x0a0b0c

### `ArrayBuffer compress(std::string buffer, {level})`;

`compress` will re-compress the given PNG image via `buffer`. `level` is a number between 0 and 7.

### `void free_result()`

Frees the result created by `compress()`.
