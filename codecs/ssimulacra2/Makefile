# Emscripten build for Cloudinary's SSIMULACRA 2 image metric.
#
# The metric ships as a stripped subset of libjxl 0.8 (under src/lib) plus
# src/ssimulacra2.cc. That bundle's CMake builds the `jxl-static` target
# (libjxl.a) and find_package()s HWY, LCMS2 and Brotli as SYSTEM libraries -
# there is no third_party build logic in the bundle. So, unlike codecs/jxl which
# lets libjxl's own CMake add_subdirectory() its deps, we cross-compile highway,
# lcms2 and brotli ourselves and point the bundle's find_package() at the
# prebuilt artefacts via cache variables.
#
# The bundle is wired for lcms2 (not skcms): enabling skcms needs a `skcms`
# CMake target the stripped bundle never defines, so JPEGXL_ENABLE_SKCMS=1 would
# fail at configure. We therefore build lcms2.
#
# Run inside the shared codecs Docker via ../build-cpp.sh (emscripten/emsdk
# 5.0.7), whose CMD is `emmake make -j<nproc>`. CXXFLAGS / CFLAGS / LDFLAGS are
# exported by codecs/cpp.Dockerfile.

# ---- ssimulacra2 (+ bundled libjxl subset) ----------------------------------
SS2_URL     = https://github.com/cloudinary/ssimulacra2/archive/refs/tags/v2.1.tar.gz
SS2_PACKAGE = node_modules/ssimulacra2.tar.gz
SS2_DIR     = node_modules/ssimulacra2
# The libjxl subset lives under src/; that is also the libjxl "project root"
# that resolves the wrapper's #include "lib/jxl/..." and "ssimulacra2.h".
JXL_SRC     = $(SS2_DIR)/src
# NB: the build dirs are named "_build", not "build": highway and brotli ship a
# Bazel "BUILD" file at their root, which collides with a "build" directory on
# case-insensitive filesystems (macOS), breaking CMake's scratch-dir creation.
JXL_BUILD   = $(SS2_DIR)/_build
LIBJXL_A    = $(JXL_BUILD)/lib/libjxl.a
# The metric implementation, compiled alongside our wrapper.
SS2_CC      = $(JXL_SRC)/ssimulacra2.cc

# ---- highway (pinned to libjxl 0.8.2 deps.sh) -------------------------------
HWY_URL     = https://github.com/google/highway/archive/f670ea580bb70b4113b63b9cdaa42ba9b10cd13a.tar.gz
HWY_PACKAGE = node_modules/highway.tar.gz
HWY_DIR     = node_modules/highway
HWY_BUILD   = $(HWY_DIR)/_build
LIBHWY_A    = $(HWY_BUILD)/libhwy.a

# ---- brotli (pinned to libjxl 0.8.2 deps.sh) --------------------------------
BROTLI_URL       = https://github.com/google/brotli/archive/35ef5c554d888bef217d449346067de05e269b30.tar.gz
BROTLI_PACKAGE   = node_modules/brotli.tar.gz
BROTLI_DIR       = node_modules/brotli
BROTLI_BUILD     = $(BROTLI_DIR)/_build
LIBBROTLI_COMMON = $(BROTLI_BUILD)/libbrotlicommon-static.a
LIBBROTLI_DEC    = $(BROTLI_BUILD)/libbrotlidec-static.a
LIBBROTLI_ENC    = $(BROTLI_BUILD)/libbrotlienc-static.a
LIBBROTLI_ALL    = $(LIBBROTLI_DEC) $(LIBBROTLI_ENC) $(LIBBROTLI_COMMON)

# ---- lcms2 (colour management; built with autotools) ------------------------
# 2.13.x matches libjxl 0.8's bundled Little-CMS. The release ships a prebuilt
# ./configure but no CMakeLists, so we use emconfigure + emmake.
LCMS2_URL     = https://github.com/mm2/Little-CMS/archive/refs/tags/lcms2.13.1.tar.gz
LCMS2_PACKAGE = node_modules/lcms2.tar.gz
LCMS2_DIR     = node_modules/lcms2
LIBLCMS2_A    = $(LCMS2_DIR)/src/.libs/liblcms2.a

ENVIRONMENT = worker

# Enable WebAssembly SIMD. The shared CFLAGS in codecs/cpp.Dockerfile do NOT set
# this, so without it Highway compiles to its scalar EMU128 target and libjxl's
# metric loops stay scalar. With it, Highway selects its wasm SIMD target and
# SSIMULACRA 2's per-pixel math (downsampling, blur, SSIM/edge maps) vectorises.
# Must reach every object that emits the metric's hot kernels, so it's added to
# the final link AND propagated into the dependency CMake builds below (mirrors
# codecs/avif's SIMD_COMPILE_FLAGS / DEP_COMPILE_FLAGS plumbing).
SIMD_FLAGS = -msimd128

# Build for wasm64 (memory64).
#
# SSIMULACRA 2 holds both images as float planes and keeps ~10 full-resolution
# Image3F buffers live at scale 0, which measures out at roughly 165 bytes/px.
# A 35 MP pair (e.g. 4810x7211) therefore wants ~5.7 GB - unreachable in wasm32,
# where a 32-bit pointer caps the heap at 4 GB no matter what MAXIMUM_MEMORY
# says. libjxl reacts to the failed allocation by aborting the whole module
# ("image.cc:94: JXL_CHECK: bytes_.get()"), so wasm32 could only ever refuse
# these images, not score them.
#
# -m64 switches to 64-bit pointers and lifts that ceiling. Like SIMD, it has to
# reach *every* object: wasm32 and wasm64 objects cannot be linked together, so
# this is propagated into all the dependency builds below as well.
MEM64_FLAGS = -m64

# With 64-bit pointers the cap is a policy choice rather than an architectural
# one, and 16 GB is as high as it goes: wasm-ld rejects anything above
# 17179869184 bytes. Declaring the maximum costs nothing - measured instantiate
# time and RSS are identical at 4, 8 and 16 GB, because ALLOW_MEMORY_GROWTH
# (codecs/cpp.Dockerfile) means pages are only committed as they're touched. So
# there's no reason to cap lower and refuse images a capable machine could
# score; the practical limit is whatever the host will actually hand over.
MEMORY_FLAGS = -s MAXIMUM_MEMORY=16GB

# Everything that must be identical across the wrapper and every dependency.
DEP_COMPILE_FLAGS = $(SIMD_FLAGS) $(MEM64_FLAGS)

OUT_JS   = ssimulacra2.js
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
#   $(JXL_SRC)               -> "lib/jxl/...", "ssimulacra2.h"
#   $(JXL_SRC)/lib           -> internal "jxl/..." paths
#   $(JXL_SRC)/lib/include   -> public C headers (jxl/cms_interface.h, etc.)
#   $(JXL_BUILD)/lib/include -> generated headers (jxl/jxl_export.h, jxl/version.h)
#   $(HWY_DIR)               -> "hwy/base.h" etc, transitively included by the
#                               libjxl headers our wrapper/the metric pull in
# Link order: our object + the metric, then libjxl, then its deps. Brotli is
# kept on the link as a safety net (the bundle comments it out of libjxl's own
# link, so any brotli symbols pulled from the archive resolve here); common goes
# last because dec/enc depend on it.
$(OUT_JS): ssimulacra2.cpp $(SS2_CC) $(LIBJXL_A) $(LIBHWY_A) $(LIBLCMS2_A) $(LIBBROTLI_ALL) $(MAKEFILE_DEPS)
	$(CXX) \
		$(CXXFLAGS) \
		$(DEP_COMPILE_FLAGS) \
		$(LDFLAGS) \
		$(MEMORY_FLAGS) \
		$(DEBUG_FLAGS) \
		-I $(JXL_SRC) \
		-I $(JXL_SRC)/lib \
		-I $(JXL_SRC)/lib/include \
		-I $(JXL_BUILD)/lib/include \
		-I $(HWY_DIR) \
		--bind \
		-s ENVIRONMENT=$(ENVIRONMENT) \
		-s EXPORT_ES6=1 \
		-o $@ \
		ssimulacra2.cpp \
		$(SS2_CC) \
		$(LIBJXL_A) \
		$(LIBHWY_A) \
		$(LIBLCMS2_A) \
		$(LIBBROTLI_ENC) \
		$(LIBBROTLI_DEC) \
		$(LIBBROTLI_COMMON)

# ---- libjxl subset ----------------------------------------------------------
# Point the bundle's Find{HWY,LCMS2} and brotli lookups at our prebuilt
# artefacts. find_library()/find_path() are skipped when the matching cache var
# is already set, keeping Emscripten from resolving them out of its sysroot.
$(LIBJXL_A): $(JXL_SRC)/CMakeLists.txt $(LIBHWY_A) $(LIBLCMS2_A) $(LIBBROTLI_ALL) $(MAKEFILE_DEPS)
	emcmake cmake \
		-DCMAKE_BUILD_TYPE=$(CMAKE_BUILD_TYPE) \
		-DCMAKE_C_FLAGS="$(DEP_COMPILE_FLAGS)" \
		-DCMAKE_CXX_FLAGS="$(DEP_COMPILE_FLAGS)" \
		-DCMAKE_EXE_LINKER_FLAGS="$(MEM64_FLAGS)" \
		-DBUILD_SHARED_LIBS=0 \
		-DBUILD_TESTING=0 \
		-DJPEGXL_ENABLE_TOOLS=0 \
		-DJPEGXL_ENABLE_EXAMPLES=0 \
		-DJPEGXL_ENABLE_BENCHMARK=0 \
		-DJPEGXL_ENABLE_MANPAGES=0 \
		-DJPEGXL_ENABLE_DOXYGEN=0 \
		-DJPEGXL_ENABLE_SKCMS=0 \
		-DJPEGXL_ENABLE_VIEWERS=0 \
		-DJPEGXL_ENABLE_PLUGINS=0 \
		-DJPEGXL_ENABLE_DEVTOOLS=0 \
		-DJPEGXL_ENABLE_TCMALLOC=0 \
		-DJPEGXL_FORCE_SYSTEM_HWY=1 \
		-DJPEGXL_FORCE_SYSTEM_BROTLI=1 \
		-DJPEGXL_FORCE_SYSTEM_LCMS2=1 \
		-DHWY_INCLUDE_DIR=$(abspath $(HWY_DIR)) \
		-DHWY_LIBRARY=$(abspath $(LIBHWY_A)) \
		-DLCMS2_INCLUDE_DIR=$(abspath $(LCMS2_DIR)/include) \
		-DLCMS2_LIBRARY=$(abspath $(LIBLCMS2_A)) \
		-DBROTLI_INCLUDE_DIR=$(abspath $(BROTLI_DIR)/c/include) \
		-DBROTLICOMMON_LIBRARY=$(abspath $(LIBBROTLI_COMMON)) \
		-DBROTLIDEC_LIBRARY=$(abspath $(LIBBROTLI_DEC)) \
		-DBROTLIENC_LIBRARY=$(abspath $(LIBBROTLI_ENC)) \
		-B $(JXL_BUILD) \
		$(JXL_SRC)
	$(MAKE) -C $(JXL_BUILD) jxl-static

# ---- highway ----------------------------------------------------------------
$(LIBHWY_A): $(HWY_DIR)/CMakeLists.txt $(MAKEFILE_DEPS)
	emcmake cmake \
		-DCMAKE_BUILD_TYPE=$(CMAKE_BUILD_TYPE) \
		-DCMAKE_C_FLAGS="$(DEP_COMPILE_FLAGS)" \
		-DCMAKE_CXX_FLAGS="$(DEP_COMPILE_FLAGS)" \
		-DCMAKE_EXE_LINKER_FLAGS="$(MEM64_FLAGS)" \
		-DBUILD_SHARED_LIBS=0 \
		-DHWY_ENABLE_CONTRIB=0 \
		-DHWY_ENABLE_EXAMPLES=0 \
		-DHWY_ENABLE_INSTALL=0 \
		-DHWY_ENABLE_TESTS=0 \
		-B $(HWY_BUILD) \
		$(HWY_DIR)
	$(MAKE) -C $(HWY_BUILD) hwy

# ---- brotli -----------------------------------------------------------------
# One recipe produces all three archives, so it must hang off a single stamp
# target. Listing the three archives as the targets of one recipe makes GNU make
# run that recipe once *per target* under -j, and the concurrent copies race in
# the same CMake build dir - which shows up as
# "CMakeDetermineCCompiler.cmake:226 (configure_file): No such file or
# directory". Same pattern as codecs/jxl's libs.stamp.
$(LIBBROTLI_COMMON) $(LIBBROTLI_DEC) $(LIBBROTLI_ENC): $(BROTLI_BUILD)/libs.stamp
$(BROTLI_BUILD)/libs.stamp: $(BROTLI_DIR)/CMakeLists.txt $(MAKEFILE_DEPS)
	emcmake cmake \
		-DCMAKE_BUILD_TYPE=$(CMAKE_BUILD_TYPE) \
		-DCMAKE_C_FLAGS="$(DEP_COMPILE_FLAGS)" \
		-DCMAKE_CXX_FLAGS="$(DEP_COMPILE_FLAGS)" \
		-DCMAKE_EXE_LINKER_FLAGS="$(MEM64_FLAGS)" \
		-DBUILD_SHARED_LIBS=0 \
		-DBROTLI_DISABLE_TESTS=1 \
		-B $(BROTLI_BUILD) \
		$(BROTLI_DIR)
	$(MAKE) -C $(BROTLI_BUILD) brotlienc-static brotlidec-static brotlicommon-static
	touch $@

# ---- lcms2 ------------------------------------------------------------------
# --host tells autotools we're cross-compiling, so configure skips its "can we
# run a compiled program?" test (the output is wasm and can't run natively).
# lcms2's bundled config.sub (2018) doesn't know the "emscripten" OS, but does
# accept the bare "wasm32" triple, which is enough to enter cross-compile mode.
$(LIBLCMS2_A): $(LCMS2_DIR)/configure $(MAKEFILE_DEPS)
	cd $(LCMS2_DIR) && emconfigure ./configure \
		--host=wasm32 \
		CFLAGS="$(CFLAGS) $(DEP_COMPILE_FLAGS)" \
		LDFLAGS="$(MEM64_FLAGS)" \
		--enable-static --disable-shared && emmake $(MAKE)

# ---- downloads + extraction (curl + tar, like codecs/avif) ------------------
$(SS2_PACKAGE):
	mkdir -p $(@D)
	curl -sL $(SS2_URL) -o $@
$(JXL_SRC)/CMakeLists.txt $(SS2_CC): $(SS2_PACKAGE)
	mkdir -p $(SS2_DIR)
	tar xzm --strip-components 1 -C $(SS2_DIR) -f $(SS2_PACKAGE)

$(HWY_PACKAGE):
	mkdir -p $(@D)
	curl -sL $(HWY_URL) -o $@
$(HWY_DIR)/CMakeLists.txt: $(HWY_PACKAGE)
	mkdir -p $(HWY_DIR)
	tar xzm --strip-components 1 -C $(HWY_DIR) -f $(HWY_PACKAGE)

$(BROTLI_PACKAGE):
	mkdir -p $(@D)
	curl -sL $(BROTLI_URL) -o $@
$(BROTLI_DIR)/CMakeLists.txt: $(BROTLI_PACKAGE)
	mkdir -p $(BROTLI_DIR)
	tar xzm --strip-components 1 -C $(BROTLI_DIR) -f $(BROTLI_PACKAGE)

$(LCMS2_PACKAGE):
	mkdir -p $(@D)
	curl -sL $(LCMS2_URL) -o $@
$(LCMS2_DIR)/configure: $(LCMS2_PACKAGE)
	mkdir -p $(LCMS2_DIR)
	tar xzm --strip-components 1 -C $(LCMS2_DIR) -f $(LCMS2_PACKAGE)

clean:
	$(RM) $(OUT_JS) $(OUT_WASM) $(OUT_WASM).map
	$(RM) -r $(JXL_BUILD) $(HWY_BUILD) $(BROTLI_BUILD)
	-$(MAKE) -C $(LCMS2_DIR) distclean 2>/dev/null || true
