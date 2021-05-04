FROM ubuntu:20.10
RUN apt-get update && apt-get install -qqy autoconf libtool pkg-config curl build-essential
ENV WASI_SDK_VERSION "12"
ENV WASI_SDK_PREFIX "/opt/wasi-sdk"
RUN mkdir -p ${WASI_SDK_PREFIX} && \
  curl -L https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-${WASI_SDK_VERSION}/wasi-sdk-${WASI_SDK_VERSION}.0-linux.tar.gz | tar -xz --strip 1 -C /opt/wasi-sdk
WORKDIR /src
CMD ["sh", "-c", "make -j`nproc`"]
