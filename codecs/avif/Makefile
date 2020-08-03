CODEC_DIR = node_modules/libavif
CODEC_OUT_RELATIVE = build/libavif.a
CODEC_OUT := $(addprefix $(CODEC_DIR)/, $(CODEC_OUT_RELATIVE))

LIBAOM_RELATIVE = ./ext/aom/build.libavif/
LIBAOM_DIR := $(addprefix $(CODEC_DIR)/, $(LIBAOM_RELATIVE))
LIBAOM_OUT_RELATIVE = ./libaom.a
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

$(LIBAOM_OUT): $(LIBAOM_DIR)
	export CFLAGS="-w $(CFLAGS)" && \
	mkdir -p $(LIBAOM_DIR) && \
	cd $(LIBAOM_DIR) && \
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

$(LIBAOM_DIR):
	cd $(CODEC_DIR)/ext && \
	git clone -b $(LIBAOM_VERSION) --depth 1 https://aomedia.googlesource.com/aom aom

$(CODEC_OUT): $(LIBAOM_OUT)
	export CFLAGS="-w $(CFLAGS)" && \
	mkdir -p $(CODEC_DIR)/build && \
	cd $(CODEC_DIR)/build && \
	emcmake cmake \
		DCMAKE_BUILD_TYPE=Release \
		-DAVIF_CODEC_AOM=1 \
		-DAVIF_LOCAL_AOM=1 \
		../ && \
	$(MAKE) 


clean:
	$(RM) $(OUT_JS) $(OUT_WASM)
	$(RM) -rf $(LIBAOM_OUT)
	$(RM) -rf $(CODEC_OUT)
