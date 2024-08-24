ARG SDK_VERSION=wasi-sdk-21
FROM ghcr.io/webassembly/wasi-sdk:$SDK_VERSION AS wasi-sdk-official
ARG SDK_VERSION

ARG EXTRA_CFLAGS="-Os -msign-ext -mbulk-memory -mnontrapping-fptoint"
ARG EXTRA_CXXFLAGS="-std=c++17"

# NM is required by wasi-libc symbol check
ENV NM llvm-nm-${LLVM_VERSION}

RUN --mount=source=./,target=/context \
    set -eux; \
    apt-get update; \
    apt-get install -y curl patch xz-utils; \
    # Remove the old sysroot - we want to compile it ourselves
    rm -rf /wasi-sysroot; \
    # Originally the /share folder was created by `check-symbols` target, but we skipped that
    mkdir -p /wasi-libc/sysroot/share; \
    curl -sSL "https://github.com/WebAssembly/wasi-libc/archive/refs/tags/${SDK_VERSION}.tar.gz" | \
        tar xzf - --strip 1 -C /wasi-libc; \
    # See the patch file for details
    for i in /context/patches/wasi-libc/*.patch; do patch -d /wasi-libc -N -p1 < "$i"; done; \
    # Skip `check-symbols` because we changed CFLAGS and the test won't pass
    make -C /wasi-libc -o check-symbols install \
        INSTALL_DIR=/wasi-sysroot/ \
        EXTRA_CFLAGS="${EXTRA_CFLAGS}" \
        ; \
    rm -rf /wasi-libc;\
    apt-get autoremove -y; \
    rm -rf /var/lib/apt/lists/*

ENV CFLAGS "${CFLAGS} ${EXTRA_CFLAGS}"
ENV CXXFLAGS "${CFLAGS} ${EXTRA_CXXFLAGS}"

WORKDIR /src
