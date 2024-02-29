# WebP2 decoder

- Source: <https://chromium.googlesource.com/codecs/libwebp2>

## Dependencies

- Docker

## Example

N/A

## API

### `ImageData decode(uint8_t* image_buffer, int image_width, int image_height)`

Decodes the given WebP2 buffer into raw RGBA represented as an `ImageData`.
