# This is a helper Makefile for building LibAVIF + LibAOM with given params.
#
# Params that must be supplied by the caller:
#   $(CODEC_DIR)
#   $(LIBAOM_DIR)
#   $(BUILD_DIR)
#   $(OUT_JS)
#   $(OUT_CPP)
#   $(LIBAOM_FLAGS)
#   $(LIBAVIF_FLAGS)
#   $(ENVIRONMENT)

# $(OUT_JS) is something like "enc/avif_enc.js" or "enc/avif_enc_mt.js"
# so $(OUT_BUILD_DIR) will be "node_modules/build/enc/avif_enc[_mt]"
OUT_BUILD_DIR := $(BUILD_DIR)/$(basename $(OUT_JS))

# We're making libavif and libaom for every node_modules/[enc|dec]/
CODEC_BUILD_DIR := $(OUT_BUILD_DIR)/libavif
CODEC_OUT := $(CODEC_BUILD_DIR)/libavif.a

LIBAOM_BUILD_DIR := $(OUT_BUILD_DIR)/libaom
LIBAOM_OUT := $(LIBAOM_BUILD_DIR)/libaom.a

OUT_WASM = $(OUT_JS:.js=.wasm)
OUT_WORKER=$(OUT_JS:.js=.worker.js)

.PHONY: all clean

all: $(OUT_JS)

# Only add libsharpyuv as a dependency for encoders.
# Yes, that if statement is true for encoders.
ifneq (,$(findstring enc/, $(OUT_JS)))
$(OUT_JS): $(LIBSHARPYUV)
$(CODEC_OUT): $(LIBSHARPYUV)
endif

# libaom's intra-mode RD search recurses deeply. Bump both the main module
# stack and the pthread stacks from Emscripten's default 64 KB, otherwise
# the encoder hits a stack overflow inside av1_rd_pick_partition.
ifneq (,$(findstring -pthread, $(OUT_FLAGS)))
PTHREAD_STACK_FLAGS = -s STACK_SIZE=2MB -s DEFAULT_PTHREAD_STACK_SIZE=2MB
endif

# Set DEBUG_BUILD=1 to produce an unoptimised build with full DWARF debug info
# in the wasm, plus Emscripten assertions. Stack traces from this build show
# real C++ function names instead of `wasm-function[N]` indices.
ifdef DEBUG_BUILD
# -O0 / -g3 override the -O3 from CXXFLAGS; -fno-lto cancels -flto.
DEBUG_CFLAGS = -O0 -g3 -gsource-map -fno-lto
DEBUG_LDFLAGS = -O0 -g3 -gsource-map -fno-lto -s ASSERTIONS=2 -s STACK_OVERFLOW_CHECK=2
CMAKE_BUILD_TYPE = Debug
else
CMAKE_BUILD_TYPE = Release
endif

$(OUT_JS): $(OUT_CPP) $(LIBAOM_OUT) $(CODEC_OUT)
	$(CXX) \
		-I $(CODEC_DIR)/include \
		$(CXXFLAGS) \
		$(LDFLAGS) \
		$(OUT_FLAGS) \
		$(PTHREAD_STACK_FLAGS) \
		$(DEBUG_CFLAGS) \
		$(DEBUG_LDFLAGS) \
		--bind \
		-s ERROR_ON_UNDEFINED_SYMBOLS=0 \
		-s ENVIRONMENT=$(ENVIRONMENT) \
		-s EXPORT_ES6=1 \
		-o $@ \
		$+

$(CODEC_OUT): $(CODEC_DIR)/CMakeLists.txt $(LIBAOM_OUT)
	emcmake cmake \
		-DCMAKE_LIBRARY_PATH=$(LIBSHARPYUV_BUILD_DIR) \
		-DCMAKE_BUILD_TYPE=$(CMAKE_BUILD_TYPE) \
		-DBUILD_SHARED_LIBS=0 \
		-DAVIF_CODEC_AOM=1 \
		-DAOM_LIBRARY=$(LIBAOM_OUT) \
		-DAOM_INCLUDE_DIR=$(LIBAOM_DIR) \
		$(LIBAVIF_FLAGS) \
		-B $(CODEC_BUILD_DIR) \
		$(CODEC_DIR) && \
	$(MAKE) -C $(CODEC_BUILD_DIR)

$(LIBAOM_OUT): $(LIBAOM_DIR)/CMakeLists.txt
	emcmake cmake \
		-DCMAKE_BUILD_TYPE=$(CMAKE_BUILD_TYPE) \
		-DENABLE_CCACHE=0 \
		-DAOM_TARGET_CPU=generic \
		-DENABLE_DOCS=0 \
		-DENABLE_TESTS=0 \
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

clean:
	$(RM) $(OUT_JS) $(OUT_WASM) $(OUT_WORKER)
	$(MAKE) -C $(CODEC_BUILD_DIR) clean
	$(MAKE) -C $(LIBAOM_BUILD_DIR) clean
