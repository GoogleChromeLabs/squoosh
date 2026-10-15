# Jixel

- Source: <https://github.com/awxkee/jixel>
- Version: v0.4.2
- License: BSD-3-Clause OR Apache-2.0

A JPEG XL encoder written in Rust, ported and reworked from libjxl-tiny. Squoosh
also has libjxl itself (codecs/jxl); this is offered alongside it for
comparison.

Unlike the other Rust codecs, this is built for wasm32-unknown-emscripten (see
`../rust-emscripten.Dockerfile`), with threads and SIMD. jixel's thread pool is
std::thread, which only has something to run on there. `src/lib.rs` is a C ABI
over the crate, and `enc/jixel_enc.cpp` binds that to JS with embind, and runs
each encode on its own pthread - see the comment on `Job` there for why.

`make test` builds a node version for exercising the codec outside the browser.

ExtraSlow lossy can need more than wasm32's 4 GB on large images (around
10 MP), and aborts. The worker turns that into a failed encode.
