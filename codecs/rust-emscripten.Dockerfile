# For Rust codecs that need real threads. wasm32-unknown-unknown (see
# rust.Dockerfile) can't run std::thread, but on wasm32-unknown-emscripten
# std::thread is backed by emscripten's pthreads (Web Workers sharing the wasm
# memory). The Rust side builds a staticlib, and em++ links it with an embind
# wrapper, the same way the C++ codecs are built.
#
# Same emsdk as cpp.Dockerfile, so the link matches the C++ codecs.
FROM emscripten/emsdk:6.0.8

# Nightly, because std has to be rebuilt (-Z build-std) with the atomics
# feature for a shared-memory link - the prebuilt one has no atomics. Pinned so
# builds are reproducible.
ARG RUST_TOOLCHAIN=nightly-2026-10-01
ENV RUSTUP_HOME=/usr/local/rustup CARGO_HOME=/usr/local/cargo PATH=/usr/local/cargo/bin:$PATH
RUN curl -sSf https://sh.rustup.rs | sh -s -- -y --no-modify-path --profile minimal \
  --default-toolchain $RUST_TOOLCHAIN \
  --component rust-src \
  --target wasm32-unknown-emscripten

ENV CFLAGS "-O3 -flto"
ENV CXXFLAGS "${CFLAGS} -std=c++17"
ENV LDFLAGS "${CFLAGS} \
-s FILESYSTEM=0 \
-s ALLOW_MEMORY_GROWTH=1 \
-s TEXTDECODER=2 \
-s NODEJS_CATCH_EXIT=0 -s NODEJS_CATCH_REJECTION=0 \
"
# Warm emscripten's cache of the pthread + embind system libraries.
RUN em++ ${CXXFLAGS} ${LDFLAGS} --bind -pthread -xc++ /dev/null -o /dev/null
WORKDIR /src
CMD ["sh", "-c", "emmake make -j`nproc`"]
