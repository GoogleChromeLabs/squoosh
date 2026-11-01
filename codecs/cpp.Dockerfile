FROM emscripten/emsdk:6.0.13
RUN apt-get update && apt-get install -qqy autoconf libtool pkg-config
ENV CFLAGS "-O3 -flto"
ENV CXXFLAGS "${CFLAGS} -std=c++17"
# The Makefiles link with emcc, which needs telling to include the C++ stdlib.
# Stack sizes are Emscripten's old defaults; the codecs (libaom especially)
# overflow the 64KB default of Emscripten 3.1.27+.
ENV LDFLAGS "${CFLAGS} \
-s DEFAULT_TO_CXX \
-s STACK_SIZE=5MB \
-s DEFAULT_PTHREAD_STACK_SIZE=2MB \
-s FILESYSTEM=0 \
-s PTHREAD_POOL_SIZE=navigator.hardwareConcurrency \
-s ALLOW_MEMORY_GROWTH=1 \
-s TEXTDECODER=2 \
-s NODEJS_CATCH_EXIT=0 -s NODEJS_CATCH_REJECTION=0 \
"
# Build and cache standard libraries with these flags + Embind.
RUN emcc ${CXXFLAGS} ${LDFLAGS} --bind -xc++ /dev/null -o /dev/null
# And another set for the pthread variant.
RUN emcc ${CXXFLAGS} ${LDFLAGS} --bind -pthread -xc++ /dev/null -o /dev/null
WORKDIR /src
CMD ["sh", "-c", "emmake make -j`nproc`"]
