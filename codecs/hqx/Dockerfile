FROM ubuntu
RUN apt-get update && \
  apt-get install -qqy git build-essential cmake python2.7

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
RUN mkdir /opt/binaryen && \
 curl -L https://github.com/WebAssembly/binaryen/releases/download/1.38.32/binaryen-1.38.32-x86-linux.tar.gz  | tar -xzf - -C /opt/binaryen --strip 1
ENV PATH="/opt/binaryen:/opt/wabt/bin:${PATH}"
WORKDIR /src
