FROM ubuntu
RUN apt-get update && \
  apt-get install -qqy git build-essential cmake python2.7 python

RUN git clone --depth 1 --recursive https://github.com/WebAssembly/binaryen.git /usr/src/binaryen
WORKDIR /usr/src/binaryen
RUN cmake . && make wasm-opt

RUN git clone --depth 1 --recursive https://github.com/WebAssembly/wabt /usr/src/wabt
RUN mkdir -p /usr/src/wabt/build
WORKDIR /usr/src/wabt/build
RUN cmake .. -DCMAKE_INSTALL_PREFIX=/opt/wabt && \
  make && \
  make install

FROM rust
RUN rustup install nightly && \
  rustup target add --toolchain nightly wasm32-unknown-unknown && \
  cargo install wasm-pack

COPY --from=0 /opt/wabt /opt/wabt
COPY --from=0 /usr/src/binaryen /usr/src/binaryen
ENV PATH="/opt/wabt/bin:/usr/src/binaryen/bin:${PATH}"
WORKDIR /src
