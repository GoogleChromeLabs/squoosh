FROM emscripten/emsdk:1.39.19 AS wasm-tools
WORKDIR /opt/wasm-tools
RUN wget -qO- https://github.com/rustwasm/wasm-pack/releases/download/v0.9.1/wasm-pack-v0.9.1-x86_64-unknown-linux-musl.tar.gz | tar -xzf - --strip 1

FROM rust:1.44-stretch AS rust
RUN rustup target add wasm32-unknown-unknown
COPY --from=wasm-tools /emsdk/upstream/bin/wasm-opt /usr/local/bin/
COPY --from=wasm-tools /emsdk/upstream/lib/libbinaryen.so /usr/local/lib/
COPY --from=wasm-tools /emsdk/upstream/emscripten/system/include/libc/ /wasm32/include/
COPY --from=wasm-tools /emsdk/upstream/emscripten/system/lib/libc/musl/arch/emscripten/bits/ /wasm32/include/bits/
COPY --from=wasm-tools /opt/wasm-tools/wasm-pack /usr/local/cargo/bin/

ENV CPATH="/wasm32/include"
WORKDIR /src
CMD ["sh", "-c", "rm -rf pkg && wasm-pack build -- --verbose && rm pkg/.gitignore"]
