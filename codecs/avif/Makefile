CODEC_URL = https://github.com/AOMediaCodec/libavif/archive/v0.8.0.tar.gz
CODEC_DIR = node_modules/libavif
CODEC_BUILD_DIR := $(CODEC_DIR)/build
CODEC_OUT := $(CODEC_BUILD_DIR)/libavif.a

LIBAOM_URL = https://aomedia.googlesource.com/aom/+archive/v2.0.0.tar.gz
LIBAOM_DIR := $(CODEC_DIR)/ext/aom
LIBAOM_BUILD_DIR := $(LIBAOM_DIR)/build.libavif
LIBAOM_OUT := $(LIBAOM_BUILD_DIR)/libaom.a

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

$(CODEC_OUT): $(CODEC_DIR)/CMakeLists.txt $(LIBAOM_OUT)
	mkdir -p $(CODEC_BUILD_DIR)
	cd $(CODEC_BUILD_DIR) && \
	emcmake cmake \
		-DCMAKE_BUILD_TYPE=Release \
		-DBUILD_SHARED_LIBS=0 \
		-DAVIF_CODEC_AOM=1 \
		-DAVIF_LOCAL_AOM=1 \
		../ && \
	$(MAKE)

$(LIBAOM_OUT): $(LIBAOM_DIR)/CMakeLists.txt
	mkdir -p $(LIBAOM_BUILD_DIR)
	cd $(LIBAOM_BUILD_DIR) && \
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
		-DCONFIG_MULTITHREAD=0 \
		-DCONFIG_RUNTIME_CPU_DETECT=0 \
		-DCONFIG_WEBM_IO=0 \
		../ && \
	$(MAKE)

$(CODEC_DIR)/CMakeLists.txt: $(CODEC_DIR)

$(LIBAOM_DIR)/CMakeLists.txt: $(LIBAOM_DIR)

$(CODEC_DIR):
	mkdir -p $@
	curl -sL $(CODEC_URL) | tar xz --strip 1 -C $@

$(LIBAOM_DIR):
	mkdir -p $@
	curl -sL $(LIBAOM_URL) | tar xz -C $@

clean:
	$(RM) $(OUT_JS) $(OUT_WASM)
	$(MAKE) -C $(CODEC_BUILD_DIR) clean
	$(MAKE) -C $(LIBAOM_BUILD_DIR) clean
