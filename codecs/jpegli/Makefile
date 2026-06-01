# Emscripten build for jpegli, Google's improved JPEG encoder from the libjxl
# project (https://github.com/google/jpegli).
#
# We build only the encoder, using jpegli's low-level libjpeg-compatible C API
# (lib/jpegli/encode.h) directly from our embind wrapper - the same approach
# codecs/mozjpeg uses. We deliberately avoid jpegli's lib/extras encoder
# (tools/cjpegli.cc's EncodeJpeg/JpegSettings), since that pulls in PNG / sjpeg /
# skcms / CMS input decoders we don't need: our input is raw RGBA.
#
# jpegli's only build dependency (with tools/tests/extras disabled) is highway
# (hwy). highway is a git submodule, so it is NOT in the source tarball - we
# fetch and cross-compile it separately and point jpegli's CMake at the prebuilt
# libhwy.a via JPEGLI_FORCE_SYSTEM_HWY, mirroring codecs/ssimulacra2/Makefile.
#
# Run inside the shared codecs Docker via ../build-cpp.sh (emscripten/emsdk
# 5.0.7), whose CMD is `emmake make -j<nproc>`. CXXFLAGS / CFLAGS / LDFLAGS are
# exported by codecs/cpp.Dockerfile.

# ---- jpegli (pinned commit) -------------------------------------------------
JPEGLI_URL     = https://github.com/google/jpegli/archive/031a0077f5799a6041004267fc12b956c1f52a20.tar.gz
JPEGLI_PACKAGE = node_modules/jpegli.tar.gz
JPEGLI_DIR     = node_modules/jpegli
# NB: build dir is named "_build", not "build": highway ships a Bazel "BUILD"
# file at its root, which collides with a "build" directory on case-insensitive
# filesystems (macOS), breaking CMake's scratch-dir creation.
JPEGLI_BUILD   = $(JPEGLI_DIR)/_build
LIBJPEGLI_A    = $(JPEGLI_BUILD)/lib/libjpegli-static.a

# ---- highway (pinned to jpegli's deps.sh: v1.3.1-snapshot) ------------------
HWY_URL     = https://github.com/google/highway/archive/271a9a0ed9de1232d9117f1572c3fe28f8542ec1.tar.gz
HWY_PACKAGE = node_modules/highway.tar.gz
HWY_DIR     = node_modules/highway
HWY_BUILD   = $(HWY_DIR)/_build
LIBHWY_A    = $(HWY_BUILD)/libhwy.a

# ---- libjpeg-turbo (headers only; pinned to jpegli's deps.sh: 2.1.5.1) ------
# jpegli's CMake configure_file()s jpeglib.h / jconfig.h.in / jmorecfg.h from
# this submodule into the build's generated include dir. The submodule is not in
# the jpegli source tarball, so we extract it into jpegli's third_party tree
# where its CMake expects it. No .c files from libjpeg-turbo are compiled.
LJT_URL     = https://github.com/libjpeg-turbo/libjpeg-turbo/archive/8ecba3647edb6dd940463fedf38ca33a8e2a73d1.tar.gz
LJT_PACKAGE = node_modules/libjpeg-turbo.tar.gz
LJT_DIR     = $(JPEGLI_DIR)/third_party/libjpeg-turbo
LJT_MARKER  = $(LJT_DIR)/jpeglib.h

# ---- skcms (pinned to jpegli's deps.sh) -------------------------------------
# jpegli's third_party CMake unconditionally requires a colour-management
# provider (skcms or lcms2). We pick skcms because it is self-contained (a
# couple of .cc files, no further deps) - it is only compiled into the
# jpegli_cms target, which jpegli-static does not link, so it adds nothing to
# our wasm. Like libjpeg-turbo it is a submodule absent from the tarball.
SKCMS_URL    = https://github.com/google/skcms/archive/96d9171c94b937a1b5f0293de7309ac16311b722.tar.gz
SKCMS_PACKAGE = node_modules/skcms.tar.gz
SKCMS_DIR    = $(JPEGLI_DIR)/third_party/skcms
SKCMS_MARKER = $(SKCMS_DIR)/skcms.h

ENVIRONMENT = worker

OUT_JS   = enc/jpegli_enc.js
OUT_WASM = $(OUT_JS:.js=.wasm)

# Rebuild the outputs whenever the build configuration itself changes, since the
# flags live here rather than in a tracked source file.
MAKEFILE_DEPS := Makefile

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
# Include roots:
#   $(JPEGLI_DIR)                       -> "lib/jpegli/encode.h" etc.
#   $(JPEGLI_BUILD)/lib/include/jpegli   -> generated "jpeglib.h", "jconfig.h",
#                                           "jmorecfg.h" (jpegli configure_file()s
#                                           libjpeg-turbo's headers there)
#   $(HWY_DIR)                          -> "hwy/*" headers transitively pulled in
#                                           by jpegli's public headers
$(OUT_JS): enc/jpegli_enc.cpp $(LIBJPEGLI_A) $(LIBHWY_A) $(MAKEFILE_DEPS)
	$(CXX) \
		$(CXXFLAGS) \
		$(LDFLAGS) \
		$(DEBUG_FLAGS) \
		-I $(JPEGLI_DIR) \
		-I $(JPEGLI_BUILD)/lib/include/jpegli \
		-I $(HWY_DIR) \
		--bind \
		-s ENVIRONMENT=$(ENVIRONMENT) \
		-s EXPORT_ES6=1 \
		-o $@ \
		enc/jpegli_enc.cpp \
		$(LIBJPEGLI_A) \
		$(LIBHWY_A)

# ---- jpegli (libjpegli-static.a) --------------------------------------------
# Disable everything except the core encoder/decoder library, and point the
# highway lookup at our prebuilt artefact so Emscripten doesn't try to resolve
# it out of its sysroot.
$(LIBJPEGLI_A): $(JPEGLI_DIR)/CMakeLists.txt $(LJT_MARKER) $(SKCMS_MARKER) $(LIBHWY_A) $(MAKEFILE_DEPS)
	emcmake cmake \
		-DCMAKE_BUILD_TYPE=$(CMAKE_BUILD_TYPE) \
		-DBUILD_SHARED_LIBS=0 \
		-DBUILD_TESTING=0 \
		-DJPEGLI_ENABLE_SKCMS=1 \
		-DJPEGLI_BUNDLE_LIBPNG=0 \
		-DJPEGLI_ENABLE_SJPEG=0 \
		-DJPEGLI_ENABLE_OPENEXR=0 \
		-DJPEGLI_ENABLE_TOOLS=0 \
		-DJPEGLI_ENABLE_JNI=0 \
		-DJPEGLI_ENABLE_BENCHMARK=OFF \
		-DJPEGLI_ENABLE_DOXYGEN=OFF \
		-DJPEGLI_ENABLE_EXAMPLES=OFF \
		-DJPEGLI_ENABLE_MANPAGES=OFF \
		-DJPEGLI_ENABLE_WASM_THREADS=0 \
		-DJPEGLI_FORCE_SYSTEM_HWY=1 \
		-DHWY_INCLUDE_DIR=$(abspath $(HWY_DIR)) \
		-DHWY_LIBRARY=$(abspath $(LIBHWY_A)) \
		-B $(JPEGLI_BUILD) \
		$(JPEGLI_DIR)
	$(MAKE) -C $(JPEGLI_BUILD) jpegli-static

# ---- highway ----------------------------------------------------------------
$(LIBHWY_A): $(HWY_DIR)/CMakeLists.txt $(MAKEFILE_DEPS)
	emcmake cmake \
		-DCMAKE_BUILD_TYPE=$(CMAKE_BUILD_TYPE) \
		-DBUILD_SHARED_LIBS=0 \
		-DHWY_ENABLE_CONTRIB=0 \
		-DHWY_ENABLE_EXAMPLES=0 \
		-DHWY_ENABLE_INSTALL=0 \
		-DHWY_ENABLE_TESTS=0 \
		-B $(HWY_BUILD) \
		$(HWY_DIR)
	$(MAKE) -C $(HWY_BUILD) hwy

# ---- downloads + extraction (curl + tar, like codecs/avif) ------------------
$(JPEGLI_PACKAGE):
	mkdir -p $(@D)
	curl -sL $(JPEGLI_URL) -o $@
$(JPEGLI_DIR)/CMakeLists.txt: $(JPEGLI_PACKAGE)
	mkdir -p $(JPEGLI_DIR)
	tar xzm --strip-components 1 -C $(JPEGLI_DIR) -f $(JPEGLI_PACKAGE)

$(HWY_PACKAGE):
	mkdir -p $(@D)
	curl -sL $(HWY_URL) -o $@
$(HWY_DIR)/CMakeLists.txt: $(HWY_PACKAGE)
	mkdir -p $(HWY_DIR)
	tar xzm --strip-components 1 -C $(HWY_DIR) -f $(HWY_PACKAGE)

# libjpeg-turbo is extracted into jpegli's third_party tree (depends on the
# jpegli source being extracted first so the directory exists).
$(LJT_PACKAGE):
	mkdir -p $(@D)
	curl -sL $(LJT_URL) -o $@
$(LJT_MARKER): $(LJT_PACKAGE) $(JPEGLI_DIR)/CMakeLists.txt
	mkdir -p $(LJT_DIR)
	tar xzm --strip-components 1 -C $(LJT_DIR) -f $(LJT_PACKAGE)

$(SKCMS_PACKAGE):
	mkdir -p $(@D)
	curl -sL $(SKCMS_URL) -o $@
$(SKCMS_MARKER): $(SKCMS_PACKAGE) $(JPEGLI_DIR)/CMakeLists.txt
	mkdir -p $(SKCMS_DIR)
	tar xzm --strip-components 1 -C $(SKCMS_DIR) -f $(SKCMS_PACKAGE)

clean:
	$(RM) $(OUT_JS) $(OUT_WASM) $(OUT_WASM).map
	$(RM) -r $(JPEGLI_BUILD) $(HWY_BUILD)
