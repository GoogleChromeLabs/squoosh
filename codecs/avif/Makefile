# Builds the multi-threaded AVIF encoder (the only build we ship).
#
# This was previously split across Makefile + helper.Makefile to parameterise
# over several targets (single-threaded encoder, decoder, node builds). Those
# are gone, so it's all inlined here.

# using libavif from https://github.com/AOMediaCodec/libavif
LIBAVIF_VERSION = v1.4.2
LIBAVIF_URL = https://github.com/AOMediaCodec/libavif/archive/refs/tags/$(LIBAVIF_VERSION).tar.gz

# using libaom from https://aomedia.googlesource.com/aom
LIBAOM_VERSION = v3.15.0
LIBAOM_URL = https://aomedia.googlesource.com/aom/+archive/$(LIBAOM_VERSION).tar.gz

CODEC_DIR = node_modules/libavif
BUILD_DIR = node_modules/build
LIBAOM_DIR = node_modules/libaom

# We must build libsharpyuv from the libwebp revision libavif expects.
# libavif v1.4.2's ext/libsharpyuv.cmd clones libwebp v1.6.0, so track that tag.
LIBWEBP_VERSION = v1.6.0
LIBWEBP_URL_WITH_SHARPYUV = https://chromium.googlesource.com/webm/libwebp/+archive/refs/tags/$(LIBWEBP_VERSION).tar.gz
LIBWEBP_DIR := $(CODEC_DIR)/ext/libwebp
LIBSHARPYUV := $(LIBWEBP_DIR)/build/libsharpyuv.a

# Fetch stamps. A downloaded tarball or an already-extracted source tree has no
# prerequisite that changes when a pin above does, so make would happily keep
# building last version's sources after a bump. Naming each stamp after its
# pinned version means a bump names a file that does not exist yet, which
# re-runs the fetch; the recipes clear the old tree first so files deleted
# upstream don't survive the upgrade.
STAMP_DIR := node_modules/.fetched
LIBAVIF_STAMP := $(STAMP_DIR)/libavif-$(LIBAVIF_VERSION)
LIBAOM_STAMP  := $(STAMP_DIR)/libaom-$(LIBAOM_VERSION)
LIBWEBP_STAMP := $(STAMP_DIR)/libwebp-$(LIBWEBP_VERSION)

OUT_JS = enc/avif_enc_mt.js
OUT_WASM = $(OUT_JS:.js=.wasm)
OUT_WORKER = $(OUT_JS:.js=.worker.js)
OUT_CPP = enc/avif_enc.cpp

OUT_BUILD_DIR := $(BUILD_DIR)/$(basename $(OUT_JS))
CODEC_BUILD_DIR := $(OUT_BUILD_DIR)/libavif
CODEC_OUT := $(CODEC_BUILD_DIR)/libavif.a
LIBAOM_BUILD_DIR := $(OUT_BUILD_DIR)/libaom
LIBAOM_OUT := $(LIBAOM_BUILD_DIR)/libaom.a

# Rebuild the outputs whenever the build configuration itself changes, since the
# flags passed to CMake/the linker live here rather than in a tracked source
# file. Without this, editing build flags wouldn't invalidate the .wasm outputs.
MAKEFILE_DEPS := Makefile

# The encoder is decode-free, and uses libsharpyuv for higher-quality chroma
# downsampling.
LIBAVIF_FLAGS := \
	-DAVIF_CODEC_AOM_DECODE=0 \
	-DAVIF_LIBSHARPYUV=SYSTEM \
	-DLIBSHARPYUV_LIBRARY=$(abspath $(LIBSHARPYUV)) \
	-DLIBSHARPYUV_INCLUDE_DIR=$(abspath $(LIBWEBP_DIR)) \
	-DAVIF_LIBYUV=OFF
LIBAOM_FLAGS := -DCONFIG_AV1_DECODER=0

# encode() runs synchronously on the codec Web Worker's thread, so that thread is
# blocked in Atomics.wait (its event loop frozen) for the whole encode. libaom's
# av1_create_workers spawns up to maxThreads (= hardwareConcurrency) PERSISTENT
# pthreads PER codec instance, and a layered/progressive encode uses two
# instances (colour + alpha), so peak demand is ~2*hardwareConcurrency. Any
# pthread spawned beyond the preloaded pool is a fresh Web Worker whose "loaded"
# handshake the blocked thread can never process, so the encode deadlocks
# (Chrome/Safari hang; Firefox happens to pump messages during the wait and
# survives). Preloading a 2x pool means a full-threaded layered encode never has
# to spawn a worker mid-encode. Do NOT lower this below 2x without also capping
# encoder->maxThreads in avif_enc.cpp to keep peak demand within the pool.
OUT_FLAGS := -pthread -s PTHREAD_POOL_SIZE='2*navigator.hardwareConcurrency'

# libaom's intra-mode RD search recurses deeply. Bump both the main module
# stack and the pthread stacks from Emscripten's default 64 KB, otherwise
# the encoder hits a stack overflow inside av1_rd_pick_partition.
PTHREAD_STACK_FLAGS := -s STACK_SIZE=2MB -s DEFAULT_PTHREAD_STACK_SIZE=2MB

# The MT link uses --shared-memory (via -pthread), so every object in the link -
# including libaom and libavif - must be compiled with the atomics and
# bulk-memory features. -pthread enables those, so propagate it into the CMake
# compile flags for the dependency libraries too.
PTHREAD_COMPILE_FLAGS := -pthread

# Enable WebAssembly SIMD. libaom 3.x has no wasm SIMD kernels (it's built with
# AOM_TARGET_CPU=generic, i.e. scalar C), so this mainly lets LLVM autovectorise
# libaom's scalar loops and turns on libsharpyuv/libavif's vectorised paths.
# Applied to every compile so each object can emit SIMD opcodes (unlike -pthread,
# SIMD objects mix freely with non-SIMD ones, but enabling it everywhere is
# simplest and lets the optimiser vectorise across the whole tree).
SIMD_COMPILE_FLAGS := -msimd128

# Compile flags propagated into libaom's and libavif's CMake builds (and the
# final link). -pthread must be on every object in the shared-memory link;
# -msimd128 lets each object emit SIMD.
DEP_COMPILE_FLAGS := $(PTHREAD_COMPILE_FLAGS) $(SIMD_COMPILE_FLAGS)

# Set DEBUG_BUILD=1 to produce an unoptimised build with full DWARF debug info
# in the wasm, plus Emscripten assertions. Stack traces from this build show
# real C++ function names instead of `wasm-function[N]` indices.
ifdef DEBUG_BUILD
# -O0 / -g3 override the -O3 from CXXFLAGS; -fno-lto cancels -flto.
DEBUG_CFLAGS := -O0 -g3 -gsource-map -fno-lto
DEBUG_LDFLAGS := -O0 -g3 -gsource-map -fno-lto -s ASSERTIONS=2 -s STACK_OVERFLOW_CHECK=2
CMAKE_BUILD_TYPE := Debug
else
CMAKE_BUILD_TYPE := Release
endif

.PHONY: all clean

all: $(OUT_JS)

$(OUT_JS): $(OUT_CPP) $(LIBAOM_OUT) $(CODEC_OUT) $(LIBSHARPYUV) $(MAKEFILE_DEPS)
	$(CXX) \
		-I $(CODEC_DIR)/include \
		$(CXXFLAGS) \
		$(LDFLAGS) \
		$(OUT_FLAGS) \
		$(SIMD_COMPILE_FLAGS) \
		$(PTHREAD_STACK_FLAGS) \
		$(DEBUG_CFLAGS) \
		$(DEBUG_LDFLAGS) \
		--bind \
		-s ERROR_ON_UNDEFINED_SYMBOLS=0 \
		-s ENVIRONMENT=worker \
		-s EXPORT_ES6=1 \
		-o $@ \
		$(OUT_CPP) $(LIBAOM_OUT) $(CODEC_OUT) $(LIBSHARPYUV)
	# Emscripten emits `"name": "em-pthread-" + PThread.nextWorkerID` in the
	# `new Worker(...)` options. That string concat trips up
	# rollup-plugin-off-main-thread's JSON5 parser, leaving `type: "module"`
	# in the AMD output. The worker name is only used as a startsWith prefix
	# to detect pthread workers, so a static string is equivalent.
	sed -i.bak 's/"em-pthread-" + PThread.nextWorkerID/"em-pthread"/g' $@ && rm $@.bak

$(CODEC_OUT): $(LIBAVIF_STAMP) $(LIBAOM_OUT) $(LIBSHARPYUV) $(MAKEFILE_DEPS)
	emcmake cmake \
		-DCMAKE_BUILD_TYPE=$(CMAKE_BUILD_TYPE) \
		-DCMAKE_C_FLAGS="$(CFLAGS) $(DEP_COMPILE_FLAGS)" \
		-DCMAKE_CXX_FLAGS="$(CXXFLAGS) $(DEP_COMPILE_FLAGS)" \
		-DBUILD_SHARED_LIBS=0 \
		-DAVIF_CODEC_AOM=SYSTEM \
		-DAOM_LIBRARY=$(LIBAOM_OUT) \
		-DAOM_INCLUDE_DIR=$(LIBAOM_DIR) \
		$(LIBAVIF_FLAGS) \
		-B $(CODEC_BUILD_DIR) \
		$(CODEC_DIR) && \
	$(MAKE) -C $(CODEC_BUILD_DIR)

# We build libaom's default `all` target, so everything the CMake config enables
# gets compiled - hence the ENABLE_* switches below. Note ENABLE_APPS: libaom
# 3.15.0 split the aomenc/aomdec applications out of ENABLE_EXAMPLES into a new
# ENABLE_APPS option that defaults to ON, so ENABLE_EXAMPLES=0 (which covered
# them up to 3.14.x) is no longer enough to keep aomenc out of the build.
$(LIBAOM_OUT): $(LIBAOM_STAMP) $(MAKEFILE_DEPS)
	emcmake cmake \
		-DCMAKE_BUILD_TYPE=$(CMAKE_BUILD_TYPE) \
		-DCMAKE_C_FLAGS="$(CFLAGS) $(DEP_COMPILE_FLAGS)" \
		-DCMAKE_CXX_FLAGS="$(CXXFLAGS) $(DEP_COMPILE_FLAGS)" \
		-DENABLE_CCACHE=0 \
		-DAOM_TARGET_CPU=generic \
		-DENABLE_DOCS=0 \
		-DENABLE_TESTS=0 \
		-DENABLE_APPS=0 \
		-DENABLE_EXAMPLES=0 \
		-DENABLE_TOOLS=0 \
		-DCONFIG_ACCOUNTING=1 \
		-DCONFIG_INSPECTION=0 \
		-DCONFIG_RUNTIME_CPU_DETECT=0 \
		-DCONFIG_WEBM_IO=0 \
		$(LIBAOM_FLAGS) \
		-B $(LIBAOM_BUILD_DIR) \
		$(LIBAOM_DIR) && \
	$(MAKE) -C $(LIBAOM_BUILD_DIR)

# ---- source fetch (stamped by pinned version - see STAMP_DIR above) ---------

$(LIBAOM_STAMP):
	$(RM) -r $(LIBAOM_DIR) $(STAMP_DIR)/libaom-*
	mkdir -p $(LIBAOM_DIR) $(STAMP_DIR)
	curl -sL $(LIBAOM_URL) | tar xzm -C $(LIBAOM_DIR)
	touch $@

# Refreshing libavif wipes ext/libwebp with it, so drop the libwebp stamp too -
# that forces the libwebp fetch below to re-run rather than leaving a stamp
# claiming a tree that no longer exists.
$(LIBAVIF_STAMP):
	$(RM) -r $(CODEC_DIR) $(STAMP_DIR)/libavif-* $(STAMP_DIR)/libwebp-*
	mkdir -p $(CODEC_DIR) $(STAMP_DIR)
	curl -sL $(LIBAVIF_URL) | tar xzm --strip 1 -C $(CODEC_DIR)
	touch $@

# libwebp is extracted INTO the libavif tree, so it must be fetched after it.
$(LIBWEBP_STAMP): $(LIBAVIF_STAMP)
	$(RM) -r $(LIBWEBP_DIR) $(STAMP_DIR)/libwebp-*
	mkdir -p $(LIBWEBP_DIR) $(STAMP_DIR)
	curl -sL $(LIBWEBP_URL_WITH_SHARPYUV) | tar xzm -C $(LIBWEBP_DIR)
	touch $@

# Build libsharpyuv.a. It's thread-free (no -pthread) - it links cleanly into
# the shared-memory encoder because it uses no atomics/TLS. -msimd128 turns on
# its hand-written SIMD chroma-conversion paths. This build doesn't inherit
# CFLAGS, so SIMD is passed explicitly via CMAKE_C_FLAGS.
$(LIBSHARPYUV): $(LIBWEBP_STAMP)
	mkdir -p $(@D)
	emcmake cmake \
		-DCMAKE_C_FLAGS="$(CFLAGS) $(SIMD_COMPILE_FLAGS)" \
		-DWEBP_BUILD_ANIM_UTILS=OFF \
		-DWEBP_BUILD_CWEBP=OFF \
		-DWEBP_BUILD_DWEBP=OFF \
		-DWEBP_BUILD_GIF2WEBP=OFF \
		-DWEBP_BUILD_IMG2WEBP=OFF \
		-DWEBP_BUILD_VWEBP=OFF \
		-DWEBP_BUILD_WEBPINFO=OFF \
		-DWEBP_BUILD_LIBWEBPMUX=OFF \
		-DWEBP_BUILD_WEBPMUX=OFF \
		-DWEBP_BUILD_EXTRAS=OFF \
		-DBUILD_SHARED_LIBS=OFF \
		-DCMAKE_BUILD_TYPE=Release \
		-S $(LIBWEBP_DIR) \
		-B $(@D)
	$(MAKE) -C $(@D) sharpyuv

clean:
	$(RM) $(OUT_JS) $(OUT_WASM) $(OUT_WORKER)
	$(MAKE) -C $(CODEC_BUILD_DIR) clean
	$(MAKE) -C $(LIBAOM_BUILD_DIR) clean
