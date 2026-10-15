# Brotli

An Emscripten build of the encoder from [Google's reference Brotli
implementation](https://github.com/google/brotli) (v1.1.0).

Squoosh uses this to measure, not to produce output. A vector source is
presented at the size it would be as `Content-Encoding: br`, because SVG is text
and a browser downloading it receives the compressed form — so the size on disk
isn't what it costs to serve, and comparing an already-compressed raster
encoding against an uncompressed SVG would overstate the saving. The binding
therefore returns a byte count and discards the compressed bytes.

Only the encoder is linked; nothing here ever decompresses.

## API

The module is built with Embind and exposes a single function.

```js
import moduleFactory from './enc/brotli_enc.js';

const module = await moduleFactory();
const bytes = module.compressed_size(uint8Array);
```

- `data`: a `BufferSource` holding the bytes to measure.
- Returns the compressed size in bytes, or `-1` on failure.

Settings are fixed at maximum — quality 11, window 24, `BROTLI_MODE_TEXT` — so
there is nothing to configure. Window 24 is the largest RFC 7932 allows, and
therefore the largest a `Content-Encoding: br` decoder is obliged to handle;
it only makes a difference above 4MB.

## Why the C library rather than a Rust port

`rust-brotli` was the first implementation used here, and it produced a 992KB
wasm against this build's 625KB. Almost all of the difference is one table:
its `FastLog2u16` is a `[f32; 65536]` lookup, 262KB of data with no feature flag
to disable it, and 65535 of its 65536 entries are bit-identical to computing
`log2` directly. The C library has no equivalent table.

Using the reference encoder also means the sizes Squoosh reports match what a
server compressing the same file would produce byte-for-byte, which the Rust
port did not quite do (it was within ~0.003%).

## Build

Built like the other C/C++ codecs (see [../README.md](../README.md)):

```
$ npm install
$ npm run build
```

The `Makefile` downloads the pinned Brotli release, cross-compiles
`brotlienc-static` and `brotlicommon-static` with Emscripten via brotli's own
CMake, and links them against `enc/brotli_enc.cpp`. See the comments there for
why it builds `-Oz` rather than the shared `-O3`.

Set `DEBUG_BUILD=1` for an unoptimised wasm with DWARF info and assertions.
