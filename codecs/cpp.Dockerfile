FROM emscripten/emsdk:6.0.8
RUN apt-get update && apt-get install -qqy autoconf libtool pkg-config
ENV CFLAGS "-O3 -flto"
ENV CXXFLAGS "${CFLAGS} -std=c++17"
ENV LDFLAGS "${CFLAGS} \
-s FILESYSTEM=0 \
-s PTHREAD_POOL_SIZE=navigator.hardwareConcurrency \
-s ALLOW_MEMORY_GROWTH=1 \
-s TEXTDECODER=2 \
-s NODEJS_CATCH_EXIT=0 -s NODEJS_CATCH_REJECTION=0 \
"
# Build and cache standard libraries with these flags + Embind. Must be em++,
# not emcc: emcc is the C driver and doesn't link libc++, and since emsdk 6.0.0
# moved embind's RTTI into its own libembind-rtti.a that fails the link with
# "undefined symbol: typeinfo for void". em++ is also what the codec Makefiles
# use ($(CXX)), so this warms the cache they actually consume.
RUN em++ ${CXXFLAGS} ${LDFLAGS} --bind -xc++ /dev/null -o /dev/null
# And another set for the pthread variant.
RUN em++ ${CXXFLAGS} ${LDFLAGS} --bind -pthread -xc++ /dev/null -o /dev/null
WORKDIR /src
CMD ["sh", "-c", "emmake make -j`nproc`"]
