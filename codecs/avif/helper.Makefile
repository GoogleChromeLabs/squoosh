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

# Take from libavif/ext/libsharpyuv.cmd
WEBP_URL = https://chromium.googlesource.com/webm/libwebp
WEBP_COMMIT = e2c85878f6a33f29948b43d3492d9cdaf801aa54
LIBSHARPYUV_DIR = $(CODEC_DIR)/ext/libwebp

# $(OUT_JS) is something like "enc/avif_enc.js" or "enc/avif_enc_mt.js"
OUT_BUILD_DIR := $(BUILD_DIR)/$(basename $(OUT_JS))

CODEC_BUILD_DIR := $(OUT_BUILD_DIR)/libavif
CODEC_OUT := $(CODEC_BUILD_DIR)/libavif.a

LIBAOM_BUILD_DIR := $(OUT_BUILD_DIR)/libaom
LIBAOM_OUT := $(LIBAOM_BUILD_DIR)/libaom.a

LIBSHARPYUV_BUILD_DIR := $(OUT_BUILD_DIR)/libsharpyuvLOLOLOL
LIBSHARPYUV_OUT := $(LIBSHARPYUV_BUILD_DIR)/libsharpyuv.a

OUT_WASM = $(OUT_JS:.js=.wasm)
OUT_WORKER=$(OUT_JS:.js=.worker.js)

.PHONY: all clean

all: $(OUT_JS)

# Only add libsharpyuv as a dependency for encoders.
# Yes, that if statement is true for encoders.
ifneq (,$(findstring enc/, $(OUT_JS)))
$(OUT_JS): $(LIBSHARPYUV_OUT)
$(CODEC_OUT): $(LIBSHARPYUV_OUT)
endif

$(OUT_JS): $(OUT_CPP) $(LIBAOM_OUT) $(CODEC_OUT)
	$(CXX) \
		-I $(CODEC_DIR)/include \
		$(CXXFLAGS) \
		$(LDFLAGS) \
		$(OUT_FLAGS) \
		--bind \
		-s ENVIRONMENT=$(ENVIRONMENT) \
		-s EXPORT_ES6=1 \
		-o $@ \
		$+

$(CODEC_OUT): $(CODEC_DIR)/CMakeLists.txt $(LIBAOM_OUT)
	emcmake cmake \
		-DCMAKE_LIBRARY_PATH=$(LIBSHARPYUV_BUILD_DIR) \
		-DCMAKE_BUILD_TYPE=Release \
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

$(LIBSHARPYUV_OUT): $(LIBSHARPYUV_DIR)/CMakeLists.txt
		emcmake cmake \
			-DBUILD_SHARED_LIBS=OFF \
			-DCMAKE_BUILD_TYPE=Release \
			-B $(LIBSHARPYUV_BUILD_DIR) \
			$(LIBSHARPYUV_DIR)
		$(MAKE) -C $(LIBSHARPYUV_BUILD_DIR) sharpyuv

$(LIBSHARPYUV_DIR)/CMakeLists.txt: $(CODEC_DIR)/CMakeLists.txt
	cd $(CODEC_DIR)/ext && \
		git clone $(WEBP_URL) --single-branch libwebp && \
		cd libwebp && \
		git checkout $(WEBP_COMMIT)


clean:
	$(RM) $(OUT_JS) $(OUT_WASM) $(OUT_WORKER)
	$(MAKE) -C $(CODEC_BUILD_DIR) clean
	$(MAKE) -C $(LIBAOM_BUILD_DIR) clean
