FROM ubuntu:20.10
RUN apt-get update && apt-get install -qqy autoconf libtool pkg-config curl build-essential
ENV WASI_SDK_VERSION "12"
ENV WASI_SDK_PREFIX "/opt/wasi-sdk"
RUN mkdir -p ${WASI_SDK_PREFIX} && \
  curl -L https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-${WASI_SDK_VERSION}/wasi-sdk-${WASI_SDK_VERSION}.0-linux.tar.gz | tar -xz --strip 1 -C /opt/wasi-sdk
ENV BINARYEN_PREFIX "/opt/binaryen"
RUN mkdir -p ${BINARYEN_PREFIX} && \
  curl -L https://github.com/WebAssembly/binaryen/releases/download/version_101/binaryen-version_101-x86_64-linux.tar.gz | tar -xz --strip 1 -C ${BINARYEN_PREFIX}
# Maybe we need it later. Leaving it here for now.
# ENV WABT_PREFIX "/opt/wabt"
# RUN mkdir -p ${WABT_PREFIX} && \
#   curl -L https://github.com/WebAssembly/wabt/releases/download/1.0.23/wabt-1.0.23-ubuntu.tar.gz | tar -xz --strip 1 -C ${WABT_PREFIX}
WORKDIR /src
CMD ["sh", "-c", "make -j`nproc`"]
