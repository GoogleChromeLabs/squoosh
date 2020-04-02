FROM rust
RUN rustup target add wasm32-unknown-unknown
RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

RUN mkdir /opt/wabt && \
 curl -L https://github.com/WebAssembly/wabt/releases/download/1.0.11/wabt-1.0.11-linux.tar.gz  | tar -xzf - -C /opt/wabt --strip 1

RUN mkdir /opt/wasi-sdk && \
  curl -L https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-8/wasi-sdk-8.0-linux.tar.gz | tar -xzf - -C /opt/wasi-sdk --strip 1

ENV PATH="/opt/wabt:/opt/wasi-sdk/bin:${PATH}"
WORKDIR /src
