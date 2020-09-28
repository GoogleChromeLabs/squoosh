# This is a helper Makefile for building LibAVIF + LibAOM with given params.
#
# Params that must be supplied by the caller:
#   $(CODEC_DIR)
#   $(LIBAOM_DIR)
#   $(OUT_JS)
#   $(OUT_CPP)
#   $(LIBAOM_FLAGS)
#   $(CODEC_PACKAGE)
#   $(LIBAOM_PACKAGE)

CODEC_BUILD_DIR := $(CODEC_DIR)/build
CODEC_OUT := $(CODEC_BUILD_DIR)/libavif.a

LIBAOM_BUILD_DIR := $(CODEC_DIR)/ext/aom/build.libavif
LIBAOM_OUT := $(LIBAOM_BUILD_DIR)/libaom.a

OUT_WASM = $(OUT_JS:.js=.wasm)
OUT_WORKER=$(OUT_JS:.js=.worker.js)

.PHONY: all clean

all: $(OUT_JS)

$(OUT_JS): $(OUT_CPP) $(LIBAOM_OUT) $(CODEC_OUT)
	# ERROR_ON_UNDEFINED_SYMBOLS=0 is needed to separate the encoder and decoder
	$(CXX) \
		-I $(CODEC_DIR)/include \
		$(CXXFLAGS) \
		$(LDFLAGS) \
		$(OUT_FLAGS) \
		--bind \
		--closure 1 \
		-s ALLOW_MEMORY_GROWTH=1 \
		-s MODULARIZE=1 \
		-s ERROR_ON_UNDEFINED_SYMBOLS=0 \
		-s 'EXPORT_NAME="$(basename $(@F))"' \
		-o $@ \
		$+

$(CODEC_OUT): $(CODEC_DIR)/CMakeLists.txt $(LIBAOM_OUT)
	emcmake cmake \
		-DCMAKE_BUILD_TYPE=Release \
		-DBUILD_SHARED_LIBS=0 \
		-DAVIF_CODEC_AOM=1 \
		-DAVIF_LOCAL_AOM=1 \
		-DAVIF_CODEC_INCLUDES=$(abspath $(LIBAOM_DIR)) \
		-B $(CODEC_BUILD_DIR) \
		$(CODEC_DIR) && \
	$(MAKE) -C $(CODEC_BUILD_DIR)

$(LIBAOM_OUT): $(LIBAOM_DIR)/CMakeLists.txt
	emcmake cmake \
		-DCMAKE_BUILD_TYPE=Release \
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

$(CODEC_DIR)/CMakeLists.txt: $(CODEC_PACKAGE)
	mkdir -p $(@D)
	tar xzm --strip 1 -C $(@D) -f $(CODEC_PACKAGE)

clean:
	$(RM) $(OUT_JS) $(OUT_WASM) $(OUT_WORKER)
	$(MAKE) -C $(CODEC_BUILD_DIR) clean
	$(MAKE) -C $(LIBAOM_BUILD_DIR) clean
