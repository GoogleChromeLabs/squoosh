# Codecs

This folder contains a self-contained sub-project for each codec that squoosh supports.

## Build

Each subproject can be built using the following commands:

```
$ npm install
$ npm run build
```

This will build two files: `<codec name>_codec.js` and `<codec name>_codec.wasm`. Due to some current limitations in Emscripten, both of these files have to be served from the root folder. When the `.js` file is loaded, a global `<codec name>` is created with the same API as an [Emscripten `Module`](https://kripken.github.io/emscripten-site/docs/api_reference/module.html).

Each codec offers at least 2 functions:

- `void encode(uint8_t* img_in, int width, int height, float quality)`
- `void decode(???)`

Example:

```html
<!-- *_codec.{wasm,js} need to be in / -->
<script src="/mozjpeg_codec.js"></script>
<script>
  mozjpeg.onRuntimeInitialized = _ => {
    const encode = mozjpeg.cwrap('encode', '', ['number', 'number', 'number', 'number']);
    /* ... */
  };
</script>
```
