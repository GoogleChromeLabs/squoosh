ROOT_DIR = ./node_modules
CODEC_DIR_RELATIVE = libavif
CODEC_DIR = $(addprefix $(ROOT_DIR)/, $(CODEC_DIR_RELATIVE))
CODEC_OUT_RELATIVE = build/libavif.a
CODEC_OUT := $(addprefix $(CODEC_DIR)/, $(CODEC_OUT_RELATIVE))

CODEC_VERSION = "v0.8.0"

LIBAOM_RELATIVE = ext/aom/
LIBAOM_DIR := $(addprefix $(CODEC_DIR)/, $(LIBAOM_RELATIVE))
LIBAOM_OUT_RELATIVE = build.libavif/libaom.a
LIBAOM_OUT := $(addprefix $(LIBAOM_DIR)/, $(LIBAOM_OUT_RELATIVE))

LIBAOM_VERSION = "v2.0.0"

OUT_JS = enc/avif_enc.js dec/avif_dec.js
OUT_WASM = $(OUT_JS:.js=.wasm)

.PHONY: all clean

all: $(OUT_JS)

%.js: %.cpp $(LIBAOM_OUT) $(CODEC_OUT)
	$(CXX) \
		-I $(CODEC_DIR)/include \
		${CXXFLAGS} \
		${LDFLAGS} \
		--bind \
		--closure 1 \
		-s ALLOW_MEMORY_GROWTH=1 \
		-s MODULARIZE=1 \
		-s 'EXPORT_NAME="$(basename $(@F))"' \
		-o $@ \
		$+

$(LIBAOM_OUT): $(LIBAOM_DIR)/.git/index
	mkdir -p $(LIBAOM_DIR)/build.libavif && \
	cd $(LIBAOM_DIR)/build.libavif && \
	emcmake cmake \
		-DCMAKE_BUILD_TYPE=Release \
		-DENABLE_CCACHE=0 \
		-DAOM_TARGET_CPU=generic \
		-DENABLE_DOCS=0 \
		-DENABLE_TESTS=0 \
		-DCONFIG_ACCOUNTING=1 \
		-DCONFIG_INSPECTION=0 \
		-DCONFIG_MULTITHREAD=0 \
		-DCONFIG_RUNTIME_CPU_DETECT=0 \
		-DCONFIG_WEBM_IO=0 \
		../ && \
	$(MAKE) 

$(LIBAOM_DIR)/.git/index: $(CODEC_DIR)/.git/index
	cd $(CODEC_DIR)/ext && \
	git clone -b $(LIBAOM_VERSION) --depth 1 https://aomedia.googlesource.com/aom aom

$(CODEC_OUT): $(CODEC_DIR)/.git/index $(LIBAOM_OUT)
	mkdir -p $(CODEC_DIR)/build && \
	cd $(CODEC_DIR)/build && \
	emcmake cmake \
		DCMAKE_BUILD_TYPE=Release \
		-DAVIF_CODEC_AOM=1 \
		-DAVIF_LOCAL_AOM=1 \
		../ && \
	$(MAKE)

$(CODEC_DIR)/.git/index:
	mkdir -p $(ROOT_DIR) && \
	cd $(ROOT_DIR) && \
	git clone -b $(CODEC_VERSION) --depth 1 https://github.com/AOMediaCodec/libavif $(CODEC_DIR_RELATIVE)

clean:
	$(RM) $(OUT_JS) $(OUT_WASM)
	$(RM) -rf $(LIBAOM_OUT)
	$(RM) -rf $(CODEC_OUT)
