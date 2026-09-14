# Emscripten build for MozJPEG, encoder only.
#
# Pinned to the MozJPEG v4.1.5 release (see CODEC_VERSION). This was previously
# v3.3.1 from 2018, which built with autotools (autoreconf + ./configure);
# MozJPEG 4.x is rebased on libjpeg-turbo 2.x and builds with CMake, hence the
# rewrite below. The wrapper (enc/mozjpeg_enc.cpp) uses the libjpeg v6b API plus
# MozJPEG's jpeg_c_set_*_param extensions, both of which are unchanged across
# the bump.
#
# We produce a SINGLE build with WebAssembly SIMD (-msimd128). The unused Node
# builds (mozjpeg_node_enc) and the decoder (dec/) are gone - nothing in the app
# imported them; browsers decode JPEG natively.
#
# No threads: libjpeg/MozJPEG's compressor is single-threaded by design. There
# is no internal work-splitting to enable (unlike libaom or libwebp), so a
# -pthread build would add the shared-memory overhead for nothing.
#
# SIMD: MozJPEG's own SIMD is x86/ARM assembly (jsimd_*.asm) with no wasm port,
# so WITH_SIMD is off and CMake falls back to jsimd_none.c. -msimd128 still pays
# off by letting LLVM auto-vectorise the scalar C paths - the same situation as
# libaom in codecs/avif.
#
# Run inside the shared codecs Docker via ../build-cpp.sh (emscripten/emsdk),
# whose CMD is `emmake make -j<nproc>`. CXXFLAGS / CFLAGS / LDFLAGS are exported
# by codecs/cpp.Dockerfile.

CODEC_VERSION = v4.1.5
CODEC_URL = https://github.com/mozilla/mozjpeg/archive/refs/tags/$(CODEC_VERSION).tar.gz
CODEC_DIR = node_modules/mozjpeg
CODEC_BUILD_DIR := $(CODEC_DIR)/build

# Fetch stamp. An already-extracted source tree has no prerequisite that changes
# when CODEC_VERSION does, so make would happily keep building the old release
# after a bump. Naming the stamp after the pinned version means a bump names a
# file that does not exist yet, which re-runs the fetch. It lives outside
# CODEC_DIR because that whole tree (build dir included) is wiped on a bump.
STAMP_DIR := node_modules/.fetched
CODEC_STAMP := $(STAMP_DIR)/mozjpeg-$(CODEC_VERSION)

ENVIRONMENT = worker

SIMD_FLAGS = -msimd128

OUT_JS = enc/mozjpeg_enc.js
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

LIBJPEG_A = $(CODEC_BUILD_DIR)/libjpeg.a
# set_quality_ratings() (used by the wrapper to get MozJPEG's quality
# heuristics) lives in rdswitch.c, which upstream only compiles into the cjpeg
# and jpegtran executables - never into libjpeg. So we compile it ourselves.
# It needs the generated jconfig.h/jconfigint.h from the build dir.
RDSWITCH_O = $(CODEC_BUILD_DIR)/rdswitch.o

.PHONY: all clean

all: $(OUT_JS)

# ---- final link -------------------------------------------------------------
# Include roots:
#   $(CODEC_DIR)       -> jpeglib.h, jerror.h, cdjpeg.h, ...
#   $(CODEC_BUILD_DIR) -> CMake-generated jconfig.h / jconfigint.h / jversion.h
$(OUT_JS): enc/mozjpeg_enc.cpp $(LIBJPEG_A) $(RDSWITCH_O) $(MAKEFILE_DEPS)
	$(CXX) \
		$(CXXFLAGS) \
		$(SIMD_FLAGS) \
		$(LDFLAGS) \
		$(DEBUG_FLAGS) \
		-I $(CODEC_DIR) \
		-I $(CODEC_BUILD_DIR) \
		--bind \
		-s ENVIRONMENT=$(ENVIRONMENT) \
		-s EXPORT_ES6=1 \
		-o $@ \
		$< \
		$(LIBJPEG_A) \
		$(RDSWITCH_O)

$(RDSWITCH_O): $(CODEC_BUILD_DIR)/CMakeCache.txt $(MAKEFILE_DEPS)
	$(CC) -c \
		$(CFLAGS) \
		$(SIMD_FLAGS) \
		-I $(CODEC_DIR) \
		-I $(CODEC_BUILD_DIR) \
		-o $@ \
		$(CODEC_DIR)/rdswitch.c

# ---- libjpeg (MozJPEG) ------------------------------------------------------
# jpeg-static is the static libjpeg.a target. Tests, docs, the TurboJPEG API and
# the cjpeg/djpeg/jpegtran executables are all off - we only need the library.
$(LIBJPEG_A): $(CODEC_BUILD_DIR)/CMakeCache.txt
	$(MAKE) -C $(CODEC_BUILD_DIR) jpeg-static

$(CODEC_BUILD_DIR)/CMakeCache.txt: $(CODEC_STAMP) $(MAKEFILE_DEPS)
	emcmake cmake \
		-DCMAKE_BUILD_TYPE=$(CMAKE_BUILD_TYPE) \
		-DCMAKE_C_FLAGS="$(CFLAGS) $(SIMD_FLAGS)" \
		-DENABLE_SHARED=0 \
		-DENABLE_STATIC=1 \
		-DWITH_SIMD=0 \
		-DWITH_TURBOJPEG=0 \
		-DWITH_ARITH_ENC=0 \
		-DWITH_ARITH_DEC=0 \
		-DWITH_JAVA=0 \
		-DWITH_FUZZ=0 \
		-DPNG_SUPPORTED=0 \
		-B $(CODEC_BUILD_DIR) \
		$(CODEC_DIR)

# ---- source fetch (stamped by CODEC_VERSION - see STAMP_DIR above) ----------
$(CODEC_STAMP):
	$(RM) -r $(CODEC_DIR) $(STAMP_DIR)/mozjpeg-*
	mkdir -p $(CODEC_DIR) $(STAMP_DIR)
	curl -sL $(CODEC_URL) | tar xz --strip 1 -C $(CODEC_DIR)
	touch $@

clean:
	$(RM) $(OUT_JS) $(OUT_WASM) $(OUT_WASM:.wasm=.wasm.map)
	$(RM) -r $(CODEC_BUILD_DIR)
