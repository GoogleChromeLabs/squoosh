FROM emscripten/emsdk:6.0.13 AS wasm-tools

# Trixie, because the clang copied from the (Ubuntu 24.04) emsdk image needs
# a recent glibc.
FROM rust:1.99-slim-trixie
RUN apt-get update && apt-get install -qqy curl ca-certificates
RUN rustup target add wasm32-unknown-unknown
# The threaded OxiPNG build rebuilds std with atomics, which needs nightly.
# Keep in sync with oxipng/rust-toolchain.
RUN rustup toolchain install nightly-2026-10-01 --profile minimal \
  --target wasm32-unknown-unknown --component rust-src

# clang and libc headers, for crates that compile C to wasm.
COPY --from=wasm-tools /emsdk/upstream/bin/wasm-opt /emsdk/upstream/bin/clang-24 /usr/local/bin/
RUN ln -s clang-24 /usr/local/bin/clang
COPY --from=wasm-tools /emsdk/upstream/lib/ /usr/local/lib/
COPY --from=wasm-tools /emsdk/upstream/emscripten/cache/sysroot/include/ /wasm32/include/
ENV CPATH="/wasm32/include"

RUN curl -sL https://github.com/wasm-bindgen/wasm-pack/releases/download/v0.15.0/wasm-pack-v0.15.0-$(uname -m)-unknown-linux-musl.tar.gz \
  | tar -xzf - --strip 1 -C /usr/local/cargo/bin --wildcards '*/wasm-pack'

WORKDIR /src
CMD ["sh", "-c", "rm -rf pkg && wasm-pack build --target web -- --verbose --locked && rm pkg/.gitignore"]
