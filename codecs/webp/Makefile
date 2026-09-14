# Emscripten build for WebP (libwebp), encoder only.
#
# Pinned to the libwebp v1.6.0 release (see CODEC_VERSION). The encoder wrapper
# (enc/webp_enc.cpp) uses libwebp's stable public C API (webp/encode.h), so it
# survives version bumps. Note codecs/avif pins the same libwebp version for
# libsharpyuv - keep the two in step when bumping.
#
# We produce a SINGLE build, with WebAssembly SIMD (-msimd128) and pthreads.
# Previously this built a baseline and a -msimd128 variant and feature-detected
# between them at runtime; every browser we support has SIMD now, so the
# baseline build (and the runtime detection) is gone. The unused Node builds
# (webp_node_enc) and the decoder (dec/) went with it - the decoder was only a
# fallback for browsers that can't decode WebP natively, and there are none
# left.
#
# Threads: libwebp's encoder uses at most ONE extra worker (WebPWorker), enabled
# by WebPConfig::thread_level. It covers alpha encoding (alpha_enc.c), a split
# analysis pass on tall enough images (analysis_enc.c), and splitting the
# lossless "crunch config" search in two (vp8l_enc.c). thread_level is validated
# to 0 or 1, so 2 threads total is the ceiling - see PTHREAD_POOL_FLAGS.
# libwebp's CMake enables threading by default; the old build explicitly
# disabled it via CMAKE_DISABLE_FIND_PACKAGE_Threads.
#
# Run inside the shared codecs Docker via ../build-cpp.sh (emscripten/emsdk),
# whose CMD is `emmake make -j<nproc>`. CXXFLAGS / CFLAGS / LDFLAGS are exported
# by codecs/cpp.Dockerfile.

CODEC_VERSION = v1.6.0
CODEC_URL = https://chromium.googlesource.com/webm/libwebp/+archive/refs/tags/$(CODEC_VERSION).tar.gz
CODEC_DIR = node_modules/libwebp
CODEC_BUILD_DIR := $(CODEC_DIR)/build

# Fetch stamp. An already-extracted source tree has no prerequisite that changes
# when CODEC_VERSION does, so make would happily keep building the old release
# after a bump. Naming the stamp after the pinned version means a bump names a
# file that does not exist yet, which re-runs the fetch. It lives outside
# CODEC_DIR because that whole tree (build dir included) is wiped on a bump.
STAMP_DIR := node_modules/.fetched
CODEC_STAMP := $(STAMP_DIR)/libwebp-$(CODEC_VERSION)

ENVIRONMENT = worker

# Enable WebAssembly SIMD. libwebp has no wasm-native DSP kernels; the way to
# get SIMD out of it under Emscripten is its x86 SSE kernels, which Emscripten
# lowers onto wasm SIMD. So we ask for SSE2 + SSE4.1 alongside -msimd128.
#
# Why WEBP_HAVE_SSE2 has to be forced: libwebp's cmake/cpu.cmake walks
# WEBP_SIMD_FLAGS = "AVX2;SSE41;SSE2;MIPS32;MIPS_DSP_R2;NEON;MSA" and does
#   if(EMSCRIPTEN AND ${I_SIMD} GREATER_EQUAL 2) break()
# to stop NEON being mis-detected - but SSE2 is index 2, so under Emscripten
# SSE2 is never probed and WEBP_HAVE_SSE2 never lands in config.h. SSE4.1 (index
# 1) *is* enabled, and src/dsp/enc_sse41.c pulls its transpose helpers from
# common_sse2.h, which is `#if defined(WEBP_USE_SSE2)`. With HAVE_CONFIG_H set
# (a cmake build), WEBP_USE_SSE2 needs WEBP_HAVE_SSE2 - so the SSE4.1 kernels
# fail to compile with "call to undeclared function VP8Transpose_2_4x4_16b".
# Defining it ourselves fixes the combination; the per-file -msse* flags the
# loop would have added are covered by putting them in CMAKE_C_FLAGS instead.
# Every src/dsp/*.c is compiled unconditionally and self-guards on __SSE2__ /
# __SSE4_1__, so the global flags are what actually activate the kernels.
SIMD_FLAGS = -msimd128
CODEC_SIMD_FLAGS = $(SIMD_FLAGS) -msse2 -msse4.1
CODEC_SIMD_CMAKE_FLAGS = -DWEBP_ENABLE_SIMD=1 -DWEBP_HAVE_SSE2=1

# pthreads. -pthread is needed at compile and link, and must match the memory
# model libwebp was built with (see the CMake flags below).
#
# Pool sized to 2. libwebp creates its single side worker *during* the encode,
# while our codec Web Worker is blocked in Atomics.wait - spawning a fresh
# Worker at that point would deadlock (the "loaded" handshake can never be
# processed), exactly as documented in codecs/avif. Two slots covers the calling
# thread plus libwebp's one worker, which is the hard ceiling since
# thread_level is validated to 0 or 1. Do NOT lower this.
PTHREAD_FLAGS = -pthread
PTHREAD_POOL_FLAGS = -s PTHREAD_POOL_SIZE=2

OUT_JS = enc/webp_enc.js
OUT_WASM = $(OUT_JS:.js=.wasm)

# Rebuild outputs whenever the build configuration changes.
MAKEFILE_DEPS := Makefile

# Set DEBUG_BUILD=1 to produce an unoptimised wasm with DWARF and assertions -
# stack traces show real names instead of `wasm-function[N]`.
ifdef DEBUG_BUILD
DEBUG_FLAGS = -O0 -g3 -gsource-map -fno-lto -s ASSERTIONS=2 -s STACK_OVERFLOW_CHECK=2
CMAKE_BUILD_TYPE = Debug
else
DEBUG_FLAGS =
CMAKE_BUILD_TYPE = Release
endif

LIBWEBP_A = $(CODEC_BUILD_DIR)/libwebp.a
# Sharp YUV downsampling (config.use_sharp_yuv) lives in its own static lib.
LIBSHARPYUV_A = $(CODEC_BUILD_DIR)/libsharpyuv.a

.PHONY: all clean

all: $(OUT_JS)

# ---- final link -------------------------------------------------------------
$(OUT_JS): enc/webp_enc.cpp $(LIBWEBP_A) $(LIBSHARPYUV_A) $(MAKEFILE_DEPS)
	$(CXX) \
		$(CXXFLAGS) \
		$(SIMD_FLAGS) \
		$(LDFLAGS) \
		$(DEBUG_FLAGS) \
		$(PTHREAD_FLAGS) \
		$(PTHREAD_POOL_FLAGS) \
		-I $(CODEC_DIR) \
		--bind \
		-s ENVIRONMENT=$(ENVIRONMENT) \
		-s EXPORT_ES6=1 \
		-o $@ \
		$< \
		$(LIBWEBP_A) \
		$(LIBSHARPYUV_A)
	# In -pthread builds Emscripten emits `"name": "em-pthread-" + PThread.nextWorkerID`
	# in the `new Worker(...)` options. That string concat trips up
	# rollup-plugin-off-main-thread's JSON5 parser, leaving `type: "module"` out of
	# the AMD output. The worker name is only a startsWith prefix used to detect
	# pthread workers, so a static string is equivalent. (Mirrors codecs/avif.)
	sed -i.bak 's/"em-pthread-" + PThread.nextWorkerID/"em-pthread"/g' $@ && rm $@.bak

# ---- libwebp ----------------------------------------------------------------
# Build only the encoder libs, with the tools/extras disabled. A single recipe
# produces both archives, then stamps a marker so make tracks one prerequisite
# rather than racing two rules.
$(LIBWEBP_A) $(LIBSHARPYUV_A): $(CODEC_BUILD_DIR)/libs.stamp
$(CODEC_BUILD_DIR)/libs.stamp: $(CODEC_BUILD_DIR)/Makefile
	$(MAKE) -C $(CODEC_BUILD_DIR) webp sharpyuv
	touch $@

$(CODEC_BUILD_DIR)/Makefile: $(CODEC_STAMP) $(MAKEFILE_DEPS)
	emcmake cmake \
		-DCMAKE_BUILD_TYPE=$(CMAKE_BUILD_TYPE) \
		-DCMAKE_C_FLAGS="$(CFLAGS) $(CODEC_SIMD_FLAGS) $(PTHREAD_FLAGS)" \
		-DCMAKE_CXX_FLAGS="$(CXXFLAGS) $(CODEC_SIMD_FLAGS) $(PTHREAD_FLAGS)" \
		-DBUILD_SHARED_LIBS=0 \
		$(CODEC_SIMD_CMAKE_FLAGS) \
		-DWEBP_USE_THREAD=1 \
		-DWEBP_BUILD_ANIM_UTILS=0 \
		-DWEBP_BUILD_CWEBP=0 \
		-DWEBP_BUILD_DWEBP=0 \
		-DWEBP_BUILD_GIF2WEBP=0 \
		-DWEBP_BUILD_IMG2WEBP=0 \
		-DWEBP_BUILD_VWEBP=0 \
		-DWEBP_BUILD_WEBPINFO=0 \
		-DWEBP_BUILD_LIBWEBPMUX=0 \
		-DWEBP_BUILD_WEBPMUX=0 \
		-DWEBP_BUILD_EXTRAS=0 \
		-B $(CODEC_BUILD_DIR) \
		$(CODEC_DIR)

# ---- source fetch (stamped by CODEC_VERSION - see STAMP_DIR above) ----------
$(CODEC_STAMP):
	$(RM) -r $(CODEC_DIR) $(STAMP_DIR)/libwebp-*
	mkdir -p $(CODEC_DIR) $(STAMP_DIR)
	curl -sL $(CODEC_URL) | tar xzm -C $(CODEC_DIR)
	touch $@

clean:
	$(RM) $(OUT_JS) $(OUT_WASM) $(OUT_WASM:.wasm=.wasm.map)
	$(RM) -r $(CODEC_BUILD_DIR)
