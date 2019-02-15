FROM ubuntu
RUN apt-get update && \
  apt-get install -qqy git build-essential cmake python2.7
RUN git clone --recursive https://github.com/WebAssembly/wabt /usr/src/wabt
RUN mkdir -p /usr/src/wabt/build
WORKDIR /usr/src/wabt/build
RUN cmake .. -DCMAKE_INSTALL_PREFIX=/opt/wabt && \
  make && \
  make install

FROM rust
RUN rustup install nightly && \
  rustup target add --toolchain nightly wasm32-unknown-unknown

COPY --from=0 /opt/wabt /opt/wabt
ENV PATH="/opt/wabt/bin:${PATH}"
WORKDIR /src
