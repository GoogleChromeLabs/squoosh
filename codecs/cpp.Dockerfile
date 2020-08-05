FROM emscripten/emsdk:1.39.19
RUN apt-get update && apt-get install -qqy autoconf libtool pkg-config
ENV CFLAGS "-Os -flto"
ENV CXXFLAGS "${CFLAGS} -std=c++17"
ENV LDFLAGS "${CFLAGS}"
# Build and cache standard libraries with these flags
RUN emcc ${CXXFLAGS} --bind -xc++ /dev/null -o /dev/null
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
RUN /bin/bash -ic 'nvm install 14.7.0'
WORKDIR /src
CMD ["sh", "-c", "emmake make -j`nproc`"]
