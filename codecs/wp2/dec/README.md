# WebP2 decoder

The source for the library is not open-source _yet_. The second it is we will publicize the build steps.

## Dependencies

N/A

## Example

N/A

## API

### `RawImage decode(uint8_t* image_buffer, int image_width, int image_height)`

Decodes the given WP2 buffer into raw RGBA. `RawImage` is a class with 3 fields: `buffer`, `width`, and `height`.
