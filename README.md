# [Squoosh]!

[Squoosh] is an image compression web app that reduces image sizes through numerous formats.

# Privacy

Squoosh does not send your image to a server. All image compression processes locally.

However, Squoosh utilizes Google Analytics to collect the following:

- [Basic visitor data](https://support.google.com/analytics/answer/6004245?ref_topic=2919631).
- The before and after image size value.
- If Squoosh PWA, the type of Squoosh installation.
- If Squoosh PWA, the installation time and date.

# Developing

To develop for Squoosh:

1. Clone the repository
1. To install node packages, run:
   ```sh
   npm install
   ```
1. Then build the app by running:
   ```sh
   npm run build
   ```
1. After building, start the development server by running:
   ```sh
   npm run dev
   ```

# Codecs

1. AVIF
   - [libavif - v1.0.1](https://github.com/AOMediaCodec/libavif/releases/tag/v1.0.1)
   - [AOM Library - v3.7.0](https://aomedia.googlesource.com/aom/+/refs/tags/v3.7.0)
1. Browser JPEG
   - Uses your browser's native JPEG capabilities
1. Browser PNG
   - Uses your browser's native PNG capabilities
1. JPEGXL
   - [libjxl - v0.6.1+](https://github.com/libjxl/libjxl/commit/9f544641ec83f6abd9da598bdd08178ee8a003e0)
1. MozJPEG
   - [mozjpeg - v3.3.1](https://github.com/mozilla/mozjpeg/releases/v3.3.1)
1. OxiPNG
   - [oxipng - v3.0.0](https://github.com/shssoichiro/oxipng/releases/v3.0.0)
1. QOI
   - [phoboslab/qoi - Sep 11, 2023](https://github.com/phoboslab/qoi/commit/8d35d93cdca85d2868246c2a8a80a1e2c16ba2a8)
1. WebP
   - [webmproject/libwebp - v1.1.0+](https://github.com/webmproject/libwebp/commit/d2e245ea9e959a5a79e1db0ed2085206947e98f2)
1. WebP v2 (experimental)
   - [chromium/libwebp2 - Jan 7, 2021](https://chromium.googlesource.com/codecs/libwebp2/+/413df7caeca5013fa9a51401660f7efd8572e0ae)

# Contributing

Squoosh is an open-source project that appreciates all community involvement. To contribute to the project, follow the [contribute guide](/CONTRIBUTING.md).

[squoosh]: https://squoosh.app
