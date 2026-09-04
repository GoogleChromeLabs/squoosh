# SSIMULACRA 2

An Emscripten build of [Cloudinary's SSIMULACRA 2](https://github.com/cloudinary/ssimulacra2)
image quality metric (v2.1).

SSIMULACRA 2 compares a distorted image against an original and returns a score,
typically in the range `-inf..100`, where higher is better:

| Score | Quality |
| ----- | ------- |
| 90    | very high (visually lossless at 1:1) |
| 70    | high |
| 50    | medium |
| 30    | low |

## API

The module is built with Embind. It exposes a single class, `Ssimulacra2`,
constructed with the original (reference) image; call `compare()` with each
distorted image to score it.

```js
import moduleFactory from './ssimulacra2.js';

const module = await moduleFactory();
const ss = new module.Ssimulacra2(originalRGBA, width, height);
const score = ss.compare(distortedRGBA);
ss.delete(); // free the wasm-side instance when done
```

- `originalRGBA` / `distortedRGBA`: interleaved 8-bit RGBA (`width * height * 4`
  bytes), e.g. `ImageData.data`. Both images must share the same dimensions.
- Returns a `number`. Returns `-1` if the image is smaller than the 8×8 minimum.
- Transparency is handled by blending against both a dark and a bright
  background and returning the worse of the two scores (matching the upstream
  `ssimulacra2` tool).

## Build

Built like the other C/C++ codecs (see [../README.md](../README.md)):

```
$ npm install
$ npm run build
```

The build is self-contained: its `Makefile` downloads the SSIMULACRA 2 v2.1
source (which bundles a subset of libjxl 0.8) plus the dependencies libjxl needs
— [highway](https://github.com/google/highway),
[brotli](https://github.com/google/brotli) and
[Little-CMS](https://github.com/mm2/Little-CMS) (lcms2) — pinned to the versions
libjxl 0.8 expects, cross-compiles them with Emscripten, builds the libjxl
subset via its own CMake, and links everything against `ssimulacra2.cpp`.

Set `DEBUG_BUILD=1` for an unoptimised wasm with DWARF info and assertions.
