# Emscripten build for JPEG XL (libjxl), encoder + decoder.
#
# Pinned to a post-0.11.2 libjxl commit (see CODEC_VERSION) that fixes encoder
# bugs in the 0.11.2 tag. The encoder wrapper (enc/jxl_enc.cpp) and decoder
# wrapper (dec/jxl_dec.cpp) use libjxl's *stable public C API* (jxl/encode.h,
# jxl/decode.h) rather than internal headers, so they survive version bumps.
#
# We produce a SINGLE build of each, with WebAssembly SIMD enabled (-msimd128).
# The encoder additionally uses pthreads: libjxl's resizable parallel runner
# fans the encode across worker threads (see enc/jxl_enc.cpp). The decoder stays
# single-threaded - its work is light and not worth the thread overhead.
# Building libjxl with threads requires JPEGXL_ENABLE_WASM_THREADS=1 and the
# whole encoder pipeline (libjxl, jxl_threads, the wrapper) must agree on the
# -pthread memory model. To avoid the mid-encode pthread deadlock that bites
# Chrome/Safari (spawning a worker while the main thread is blocked in encode),
# the worker pool is preloaded at module init - see codecs/avif, same pattern.
#
# libjxl's third_party deps (highway, brotli, skcms, ...) are git submodules and
# are NOT in the GitHub release tarball, and skcms lives on a googlesource git.
# So we fetch the pinned commit via git and init the submodules, which pins every
# dep to the exact revisions libjxl tested (deps.sh) - more reliable than
# stitching together separate tarballs. (Pinned to a post-0.11.2 commit that
# fixes encoder bugs present in the 0.11.2 tag.)
#
# Run inside the shared codecs Docker via ../build-cpp.sh (emscripten/emsdk),
# whose CMD is `emmake make -j<nproc>`. CXXFLAGS / CFLAGS / LDFLAGS are exported
# by codecs/cpp.Dockerfile.

CODEC_URL = https://github.com/libjxl/libjxl.git
CODEC_VERSION = 1dfa3c26b5ac199135bddcb9d4d096ff12a7b837
CODEC_DIR = node_modules/jxl
CODEC_BUILD_DIR := $(CODEC_DIR)/build

ENVIRONMENT = worker

# Enable WebAssembly SIMD everywhere. Without it Highway compiles to its scalar
# EMU128 target and libjxl's transforms stay scalar. Applied to the final link
# and propagated into the libjxl CMake build. Mirrors codecs/jpegli.
SIMD_FLAGS = -msimd128

# pthreads for the encoder. -pthread is needed at compile and link, and must
# match the memory model libjxl + jxl_threads were built with (see the CMake
# flags below).
#
# Pool sized to 1x cores. Unlike AVIF/libaom (which spawns workers *during* the
# encode, risking a deadlock when the codec worker is blocked in Atomics.wait -
# hence its 2x preload), libjxl's resizable runner creates all its threads in
# JxlResizableParallelRunnerSetThreads, which jxl_enc.cpp calls *before* any
# encoding work. By the time the worker blocks in JxlEncoderProcessOutput the
# threads already exist, so nothing is spawned mid-encode and the deadlock can't
# arise. Our peak demand is threads = min(SuggestThreads, cores) <= cores, so a
# 1x pool covers it; preloading just saves first-encode thread-startup latency.
PTHREAD_FLAGS = -pthread
PTHREAD_POOL_FLAGS = -s PTHREAD_POOL_SIZE=navigator.hardwareConcurrency

# Encoder-only link flags. libjxl's encoder is far heavier than the decoder:
#  - It recurses deeply (especially at high effort on large images) and
#    overflows Emscripten's default 64 KB stack, so bump the stack to 8 MB. Each
#    pthread also gets its own stack, so size those too.
#  - At high effort on large images it also needs more than the default 2 GB
#    heap (wasm32's MAXIMUM_MEMORY default), so raise the cap to wasm32's 4 GB
#    addressable maximum. Memory still grows on demand (ALLOW_MEMORY_GROWTH),
#    this only lifts the ceiling.
ENC_LINK_FLAGS = \
	$(PTHREAD_FLAGS) \
	$(PTHREAD_POOL_FLAGS) \
	-s STACK_SIZE=8MB \
	-s DEFAULT_PTHREAD_STACK_SIZE=8MB \
	-s MAXIMUM_MEMORY=4GB

OUT_JS = enc/jxl_enc.js dec/jxl_dec.js
OUT_WASM = $(OUT_JS:.js=.wasm)

# Rebuild outputs whenever the build configuration changes.
MAKEFILE_DEPS := Makefile

# Disable errors on deprecated SIMD intrinsics (Highway / libjxl lag emscripten).
export CXXFLAGS += -Wno-deprecated-declarations

# Set DEBUG_BUILD=1 to produce an unoptimised wasm with DWARF and assertions -
# stack traces show real C++ names instead of `wasm-function[N]`. It also defines
# JXL_ENC_DEBUG, enabling the encoder's per-encode stderr logging (see
# enc/jxl_enc.cpp); release builds stay silent.
ifdef DEBUG_BUILD
DEBUG_FLAGS = -O0 -g3 -gsource-map -fno-lto -s ASSERTIONS=2 -s STACK_OVERFLOW_CHECK=2 -DJXL_ENC_DEBUG
CMAKE_BUILD_TYPE = Debug
else
DEBUG_FLAGS =
CMAKE_BUILD_TYPE = Release
endif

LIBJXL_A      = $(CODEC_BUILD_DIR)/lib/libjxl.a
# libjxl's colour-management code is its own static lib that libjxl.a depends on.
# It backs JxlGetDefaultCms(), which the decoder uses to convert to sRGB.
LIBJXLCMS_A   = $(CODEC_BUILD_DIR)/lib/libjxl_cms.a
# The parallel runners (JxlResizableParallelRunner) live in their own lib, linked
# by the encoder only.
LIBJXLTHREADS_A = $(CODEC_BUILD_DIR)/lib/libjxl_threads.a
LIBHWY_A      = $(CODEC_BUILD_DIR)/third_party/highway/libhwy.a
LIBBROTLI_A   = \
	$(CODEC_BUILD_DIR)/third_party/brotli/libbrotlienc.a \
	$(CODEC_BUILD_DIR)/third_party/brotli/libbrotlidec.a \
	$(CODEC_BUILD_DIR)/third_party/brotli/libbrotlicommon.a

.PHONY: all clean

all: $(OUT_JS)

# ---- final links ------------------------------------------------------------
# Include roots:
#   $(CODEC_DIR)/lib/include       -> public "jxl/encode.h", "jxl/decode.h", ...
#   $(CODEC_BUILD_DIR)/lib/include -> CMake-generated "jxl/jxl_export.h" etc.
# The encoder is multithreaded (extra link flags + the jxl_threads lib); the
# decoder is single-threaded and links neither.
enc/jxl_enc.js: enc/jxl_enc.cpp $(LIBJXL_A) $(LIBJXLTHREADS_A) $(MAKEFILE_DEPS)
enc/jxl_enc.js: LINK_EXTRA_FLAGS = $(ENC_LINK_FLAGS)
enc/jxl_enc.js: EXTRA_LIBS = $(LIBJXLTHREADS_A)
# The decoder uses no threads, but libjxl.a is now compiled with -pthread (shared
# memory model), and Emscripten can't link those objects into a non-pthread
# output - so the decoder must carry -pthread too. It needs no preloaded pool.
dec/jxl_dec.js: dec/jxl_dec.cpp $(LIBJXL_A) $(MAKEFILE_DEPS)
dec/jxl_dec.js: LINK_EXTRA_FLAGS = $(PTHREAD_FLAGS)

$(OUT_JS):
	$(CXX) \
		$(CXXFLAGS) \
		$(SIMD_FLAGS) \
		$(LDFLAGS) \
		$(DEBUG_FLAGS) \
		$(LINK_EXTRA_FLAGS) \
		-I $(CODEC_DIR)/lib/include \
		-I $(CODEC_BUILD_DIR)/lib/include \
		--bind \
		-s ENVIRONMENT=$(ENVIRONMENT) \
		-s EXPORT_ES6=1 \
		-o $@ \
		$< \
		$(LIBJXL_A) \
		$(LIBJXLCMS_A) \
		$(EXTRA_LIBS) \
		$(LIBBROTLI_A) \
		$(LIBHWY_A)

# ---- libjxl (libjxl.a + its in-tree third_party static libs) ----------------
# Build only the core encoder+decoder library, with tools/tests/extras disabled.
# JPEGXL_ENABLE_WASM_THREADS=1 builds jxl_threads (the parallel runners) and
# makes libjxl thread-safe. A single recipe produces every archive the links
# need, then stamps a marker so make tracks one prerequisite rather than racing.
$(LIBJXL_A) $(LIBJXLCMS_A) $(LIBJXLTHREADS_A) $(LIBHWY_A) $(LIBBROTLI_A): $(CODEC_BUILD_DIR)/libs.stamp
$(CODEC_BUILD_DIR)/libs.stamp: $(CODEC_BUILD_DIR)/Makefile
	$(MAKE) -C $(CODEC_BUILD_DIR) jxl jxl_cms jxl_threads brotlienc brotlidec brotlicommon hwy
	touch $@

$(CODEC_BUILD_DIR)/Makefile: $(CODEC_DIR)/CMakeLists.txt $(MAKEFILE_DEPS)
	emcmake cmake \
		-DCMAKE_BUILD_TYPE=$(CMAKE_BUILD_TYPE) \
		-DCMAKE_C_FLAGS="$(SIMD_FLAGS) $(PTHREAD_FLAGS)" \
		-DCMAKE_CXX_FLAGS="$(SIMD_FLAGS) $(PTHREAD_FLAGS)" \
		-DBUILD_SHARED_LIBS=0 \
		-DBUILD_TESTING=0 \
		-DJPEGXL_STATIC=0 \
		-DJPEGXL_ENABLE_TOOLS=0 \
		-DJPEGXL_ENABLE_DEVTOOLS=0 \
		-DJPEGXL_ENABLE_BENCHMARK=0 \
		-DJPEGXL_ENABLE_EXAMPLES=0 \
		-DJPEGXL_ENABLE_DOXYGEN=0 \
		-DJPEGXL_ENABLE_MANPAGES=0 \
		-DJPEGXL_ENABLE_JNI=0 \
		-DJPEGXL_ENABLE_JPEGLI=0 \
		-DJPEGXL_ENABLE_SJPEG=0 \
		-DJPEGXL_ENABLE_OPENEXR=0 \
		-DJPEGXL_ENABLE_PLUGINS=0 \
		-DJPEGXL_ENABLE_VIEWERS=0 \
		-DJPEGXL_ENABLE_SKCMS=1 \
		-DJPEGXL_BUNDLE_LIBPNG=0 \
		-DJPEGXL_ENABLE_FUZZERS=0 \
		-DJPEGXL_ENABLE_WASM_THREADS=1 \
		-DCMAKE_CROSSCOMPILING_EMULATOR=node \
		-B $(CODEC_BUILD_DIR) \
		$(CODEC_DIR)

# ---- source fetch (git commit + submodules) ---------------------------------
$(CODEC_DIR)/CMakeLists.txt:
	$(RM) -r $(@D)
	git init $(@D)
	git -C $(@D) fetch $(CODEC_URL) $(CODEC_VERSION) --depth 1
	git -C $(@D) checkout FETCH_HEAD
	git -C $(@D) submodule update --init --depth 1 --recursive --jobs `nproc`

clean:
	$(RM) $(OUT_JS) $(OUT_WASM) $(OUT_WASM:.wasm=.wasm.map)
	$(RM) -r $(CODEC_BUILD_DIR)
