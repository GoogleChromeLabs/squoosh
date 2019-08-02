FROM rust
RUN rustup target add wasm32-unknown-unknown
RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

RUN mkdir /opt/binaryen && \
 curl -L https://github.com/WebAssembly/binaryen/releases/download/1.38.32/binaryen-1.38.32-x86-linux.tar.gz  | tar -xzf - -C /opt/binaryen --strip 1

RUN mkdir /opt/wabt && \
 curl -L https://github.com/WebAssembly/wabt/releases/download/1.0.11/wabt-1.0.11-linux.tar.gz  | tar -xzf - -C /opt/wabt --strip 1

ENV PATH="/opt/binaryen:/opt/wabt:${PATH}"
WORKDIR /src
