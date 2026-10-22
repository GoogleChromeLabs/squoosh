# Builds the jixel encoder: a Rust staticlib (src/lib.rs, over the jixel crate)
# linked by em++ with an embind wrapper (enc/jixel_enc.cpp).
#
# This is a wasm32-unknown-emscripten build rather than the wasm-pack builds of
# the other Rust codecs, because jixel's thread pool is std::thread - which
# wasm32-unknown-unknown can't run, but which emscripten backs with pthreads.

OUT_JS = enc/jixel_enc.js
OUT_CPP = enc/jixel_enc.cpp

RUST_TARGET = wasm32-unknown-emscripten
RUST_LIB = target/$(RUST_TARGET)/release/libsquoosh_jixel.a

# The pthread link uses shared memory, so every object in it needs atomics and
# bulk memory - including std, hence rebuilding it with -Z build-std (the
# prebuilt std has neither). simd128 enables jixel's wasm SIMD kernels, which
# otherwise silently fall back to scalar code. panic_abort matches the release
# profile's panic = "abort".
RUSTFLAGS = -C target-feature=+atomics,+bulk-memory,+simd128
BUILD_STD = -Z build-std=std,panic_abort

# Preloaded pthread workers: the encode's own thread, plus the threads - 1 that
# jixel's main pool asks for (see threads() and MAX_THREADS in
# enc/jixel_enc.cpp). Anything jixel starts beyond that gets a worker on
# demand, which is safe because the calling thread isn't blocked - see Job in
# enc/jixel_enc.cpp.
POOL_SIZE = Math.min(navigator.hardwareConcurrency,8)

# Main thread stack. jixel's own threads ask std for its 2 MB default, which
# emscripten honours, so DEFAULT_PTHREAD_STACK_SIZE doesn't come into it.
STACK_FLAGS = -s STACK_SIZE=2MB

# A shared memory needs a maximum, and the default (2 GB) is tight for large
# lossless encodes. 4 GB is wasm32's ceiling.
MEMORY_FLAGS = -s MAXIMUM_MEMORY=4GB

LINK_FLAGS = \
	$(CXXFLAGS) \
	$(LDFLAGS) \
	-msimd128 \
	-pthread \
	$(STACK_FLAGS) \
	$(MEMORY_FLAGS) \
	--bind \
	-s EXPORT_ES6=1

.PHONY: all clean test $(RUST_LIB)

all: $(OUT_JS)

# Phony, so cargo decides what's stale.
$(RUST_LIB):
	RUSTFLAGS="$(RUSTFLAGS)" cargo build --release --locked --target $(RUST_TARGET) $(BUILD_STD)

$(OUT_JS): $(OUT_CPP) $(RUST_LIB) Makefile
	$(CXX) $(LINK_FLAGS) \
		-s ENVIRONMENT=worker \
		-s PTHREAD_POOL_SIZE='$(POOL_SIZE)' \
		-o $@ $(OUT_CPP) $(RUST_LIB)
	# Emscripten emits `"name": "em-pthread-" + PThread.nextWorkerID` in the
	# `new Worker(...)` options. That string concat trips up
	# rollup-plugin-off-main-thread's JSON5 parser, leaving `type: "module"`
	# in the AMD output. The worker name is only a startsWith prefix used to
	# detect pthread workers, so a static string is equivalent.
	sed -i.bak 's/"em-pthread-" + PThread.nextWorkerID/"em-pthread"/g' $@ && rm $@.bak

# A node build for testing, with the pool size and thread count taken from
# globalThis.JIXEL_POOL / JIXEL_THREADS.
test: node_modules/test/jixel_enc.mjs

node_modules/test/jixel_enc.mjs: $(OUT_CPP) $(RUST_LIB) Makefile
	mkdir -p $(dir $@)
	$(CXX) $(LINK_FLAGS) \
		-DJIXEL_THREADS_FROM_GLOBAL \
		-s ENVIRONMENT=node \
		-s PTHREAD_POOL_SIZE='globalThis.JIXEL_POOL' \
		-o $@ $(OUT_CPP) $(RUST_LIB)

clean:
	$(RM) -r target node_modules $(OUT_JS) $(OUT_JS:.js=.wasm)
