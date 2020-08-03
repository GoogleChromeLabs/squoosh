ROOT_DIR = node_modules

CODEC_DIR = $(ROOT_DIR)/libavif
CODEC_BUILD_DIR = build
CODEC_OUT := $(CODEC_DIR)/$(CODEC_BUILD_DIR)/libavif.a 

CODEC_URL = "https://github.com/AOMediaCodec/libavif"
CODEC_VERSION = "v0.8.0"

LIBAOM_DIR := $(CODEC_DIR)/ext/aom
LIBAOM_BUILD_DIR = build.libavif
LIBAOM_OUT := $(LIBAOM_DIR)/$(LIBAOM_BUILD_DIR)/libaom.a

LIBAOM_URL = "https://aomedia.googlesource.com/aom/"
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
		-s MODULARIZE=1 \ -s 'EXPORT_NAME="$(basename $(@F))"' \
		-o $@ \
		$+

$(LIBAOM_OUT): $(LIBAOM_DIR)/CMakeLists.txt
	mkdir -p $(LIBAOM_DIR)/$(LIBAOM_BUILD_DIR) && \
	cd $(LIBAOM_DIR)/$(LIBAOM_BUILD_DIR) && \
	emcmake cmake \
		-DCMAKE_BUILD_TYPE=Release \
		-DENABLE_CCACHE=0 \
		-DAOM_TARGET_CPU=generic \
		-DENABLE_DOCS=0 \
		-DENABLE_TESTS=0 \
		-DENABLE_EXAMPLES=0 \
		-DCONFIG_ACCOUNTING=1 \
		-DCONFIG_INSPECTION=0 \
		-DCONFIG_MULTITHREAD=0 \
		-DCONFIG_RUNTIME_CPU_DETECT=0 \
		-DCONFIG_WEBM_IO=0 \
		../ && \
	$(MAKE) 

$(LIBAOM_DIR)/CMakeLists.txt: $(CODEC_DIR)/CMakeLists.txt
	mkdir -p $(LIBAOM_DIR)
	curl -L $(LIBAOM_URL)/+archive/$(LIBAOM_VERSION).tar.gz | tar -xzf - -C $(LIBAOM_DIR)

$(CODEC_OUT): $(LIBAOM_OUT)
	mkdir -p $(CODEC_DIR)/$(CODEC_BUILD_DIR) && \
	cd $(CODEC_DIR)/$(CODEC_BUILD_DIR) && \
	emcmake cmake \
		DCMAKE_BUILD_TYPE=Release \
		-DAVIF_CODEC_AOM=1 \
		-DAVIF_LOCAL_AOM=1 \
		../ && \
	$(MAKE)

$(CODEC_DIR)/CMakeLists.txt:
	mkdir -p $(CODEC_DIR)
	curl -L $(CODEC_URL)/archive/$(CODEC_VERSION).tar.gz | tar -xzf - --strip 1 -C $(CODEC_DIR)

clean:
	$(RM) $(OUT_JS) $(OUT_WASM)
	$(MAKE) -C $(CODEC_DIR)/$(CODEC_BUILD_DIR) clean
	$(MAKE) -C $(LIBAOM_DIR)/$(LIBAOM_BUILD_DIR) clean
