# This is intentionally an old version of Rust. Newer versions
# generate _significantly_ bigger Wasm binaries.
FROM rust:1.37
RUN rustup target add wasm32-unknown-unknown
RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

RUN mkdir /opt/binaryen && \
 curl -L https://github.com/WebAssembly/binaryen/releases/download/1.38.32/binaryen-1.38.32-x86-linux.tar.gz  | tar -xzf - -C /opt/binaryen --strip 1

ENV PATH="/opt/binaryen:${PATH}"
WORKDIR /src
