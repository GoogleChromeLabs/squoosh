# Emscripten build for Google's reference Brotli encoder.
#
# Only the encoder is linked: Squoosh uses this to measure how small an SVG
# would be over the wire, so it never decompresses anything. brotli's CMake
# builds brotlienc and brotlidec as separate targets, so the decoder simply
# isn't asked for.
#
# The reference C library rather than a Rust port because of one table:
# rust-brotli's FastLog2u16 is a [f32; 65536] lookup (262KB of the wasm, 26% of
# the module) with no feature flag to disable it, and 65535 of its 65536 entries
# are bit-identical to computing log2 directly. The C library has no equivalent
# table, which is most of why this build is ~370KB smaller. It's also the
# encoder servers actually run, so the sizes Squoosh reports match what a server
# would produce byte-for-byte.
#
# Run inside the shared codecs Docker via ../build-cpp.sh (emscripten/emsdk
# 6.0.8), whose CMD is `emmake make -j<nproc>`. CXXFLAGS / CFLAGS / LDFLAGS are
# exported by codecs/cpp.Dockerfile.

BROTLI_VERSION = v1.1.0
BROTLI_URL     = https://github.com/google/brotli/archive/refs/tags/$(BROTLI_VERSION).tar.gz
BROTLI_DIR     = node_modules/brotli
# NB: the build dir is named "_build", not "build": brotli ships a Bazel "BUILD"
# file at its root, which collides with a "build" directory on case-insensitive
# filesystems (macOS), breaking CMake's scratch-dir creation.
BROTLI_BUILD     = $(BROTLI_DIR)/_build
# v1.1.0 dropped the "-static" suffix from the target and archive names that
# older revisions used (codecs/ssimulacra2 pins one of those, hence the
# difference); with BUILD_SHARED_LIBS=0 these targets produce the .a files.
LIBBROTLI_COMMON = $(BROTLI_BUILD)/libbrotlicommon.a
LIBBROTLI_ENC    = $(BROTLI_BUILD)/libbrotlienc.a

# A downloaded and extracted source tree has no prerequisite that changes when
# the pin above does, so make would happily keep building the old revision.
# Naming the stamp after the pinned version means a bump names a file that
# doesn't exist yet, which re-runs the fetch.
STAMP_DIR    := node_modules/.fetched
BROTLI_STAMP := $(STAMP_DIR)/brotli-$(BROTLI_VERSION)

ENVIRONMENT = worker

OUT_JS   = enc/brotli_enc.js
OUT_WASM = $(OUT_JS:.js=.wasm)

# Rebuild the outputs whenever the build configuration itself changes, since the
# flags live here rather than in a tracked source file.
MAKEFILE_DEPS := Makefile

# Optimise for size rather than the image's -O3. Quality 11 spends its time
# probing hash tables, not executing instructions, so -Oz is close to free:
# measured over a 10KB and a 1MB SVG it costs ~1ms and ~6ms respectively, and
# saves 95KB of wasm (720KB -> 625KB). For the same reason there's no -msimd128
# here: there's no hot arithmetic kernel for it to vectorise.
#
# The shared flags in codecs/cpp.Dockerfile carry -O3, so strip it rather than
# relying on a trailing -Oz winning by appearing last.
OPT_FLAGS := -Oz
CXXFLAGS  := $(filter-out -O3,$(CXXFLAGS)) $(OPT_FLAGS)
LDFLAGS   := $(filter-out -O3,$(LDFLAGS)) $(OPT_FLAGS)

ifdef DEBUG_BUILD
DEBUG_FLAGS = -O0 -g3 -gsource-map -fno-lto -s ASSERTIONS=2 -s STACK_OVERFLOW_CHECK=2
CMAKE_BUILD_TYPE = Debug
else
DEBUG_FLAGS =
CMAKE_BUILD_TYPE = Release
endif

.PHONY: all clean

all: $(OUT_JS)

# ---- final link -------------------------------------------------------------
$(OUT_JS): enc/brotli_enc.cpp $(LIBBROTLI_ENC) $(LIBBROTLI_COMMON) $(MAKEFILE_DEPS)
	$(CXX) \
		$(CXXFLAGS) \
		$(LDFLAGS) \
		$(DEBUG_FLAGS) \
		-I $(BROTLI_DIR)/c/include \
		--bind \
		-s ENVIRONMENT=$(ENVIRONMENT) \
		-s EXPORT_ES6=1 \
		-o $@ \
		enc/brotli_enc.cpp \
		$(LIBBROTLI_ENC) \
		$(LIBBROTLI_COMMON)

# ---- brotli -----------------------------------------------------------------
# CMAKE_C_FLAGS_RELEASE is overridden rather than CMAKE_C_FLAGS because CMake
# appends the per-build-type flags last, so a -Oz in CMAKE_C_FLAGS would lose to
# Release's own -O3. -flto matches the final link so the encoder's objects can
# be optimised across the library boundary.
$(LIBBROTLI_ENC) $(LIBBROTLI_COMMON): $(BROTLI_BUILD)/libs.stamp
$(BROTLI_BUILD)/libs.stamp: $(BROTLI_STAMP) $(MAKEFILE_DEPS)
	emcmake cmake \
		-DCMAKE_BUILD_TYPE=$(CMAKE_BUILD_TYPE) \
		-DCMAKE_C_FLAGS="-flto" \
		-DCMAKE_C_FLAGS_RELEASE="$(OPT_FLAGS) -DNDEBUG" \
		-DBUILD_SHARED_LIBS=0 \
		-DBROTLI_DISABLE_TESTS=1 \
		-B $(BROTLI_BUILD) \
		$(BROTLI_DIR)
	$(MAKE) -C $(BROTLI_BUILD) brotlienc brotlicommon
	touch $@

# ---- download + extraction (stamped by pinned version) ----------------------
$(BROTLI_STAMP):
	$(RM) -r $(BROTLI_DIR) $(STAMP_DIR)/brotli-*
	mkdir -p $(BROTLI_DIR) $(STAMP_DIR)
	curl -sL $(BROTLI_URL) | tar xzm --strip-components 1 -C $(BROTLI_DIR)
	touch $@

clean:
	$(RM) $(OUT_JS) $(OUT_WASM) $(OUT_WASM).map
	$(RM) -r $(BROTLI_BUILD)
