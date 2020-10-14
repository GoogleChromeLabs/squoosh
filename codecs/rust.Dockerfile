ARG RUST_IMG=rust:1.44-stretch

FROM emscripten/emsdk:1.39.19 AS wasm-tools
WORKDIR /opt/wasm-tools
RUN wget -qO- https://github.com/rustwasm/wasm-pack/releases/download/v0.9.1/wasm-pack-v0.9.1-x86_64-unknown-linux-musl.tar.gz | tar -xzf - --strip 1

FROM $RUST_IMG AS rust
ARG RUST_IMG
RUN rustup target add wasm32-unknown-unknown
RUN if [ "$RUST_IMG" = "rustlang/rust:nightly" ] ; then rustup component add rust-src ; fi
COPY --from=wasm-tools /emsdk/upstream/bin/wasm-opt /emsdk/upstream/bin/clang /usr/local/bin/
COPY --from=wasm-tools /emsdk/upstream/lib/ /usr/local/lib/
COPY --from=wasm-tools /emsdk/upstream/emscripten/system/include/libc/ /wasm32/include/
COPY --from=wasm-tools /emsdk/upstream/emscripten/system/lib/libc/musl/arch/emscripten/bits/ /wasm32/include/bits/
COPY --from=wasm-tools /opt/wasm-tools/wasm-pack /usr/local/cargo/bin/

ENV CPATH="/wasm32/include"
WORKDIR /src
CMD ["sh", "-c", "rm -rf pkg && wasm-pack build -- --verbose --locked && rm pkg/.gitignore"]
