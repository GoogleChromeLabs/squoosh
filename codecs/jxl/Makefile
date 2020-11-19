CODEC_URL = https://gitlab.com/wg1/jpeg-xl.git
CODEC_VERSION = v0.1
CODEC_DIR = node_modules/jxl
CODEC_BUILD_DIR := $(CODEC_DIR)/build
CODEC_OUT := $(CODEC_BUILD_DIR)/lib/libjxl.a

OUT_JS = enc/jxl_enc.js dec/jxl_dec.js
OUT_WASM = $(OUT_JS:.js=.wasm)

.PHONY: all clean

all: $(OUT_JS)

%.js: %.cpp $(LIBAOM_OUT) $(CODEC_OUT)
	$(CXX) \
		-I $(CODEC_DIR) \
		-I $(CODEC_DIR)/lib \
		-I $(CODEC_DIR)/lib/include \
		-I $(CODEC_BUILD_DIR)/lib/include \
		-I $(CODEC_DIR)/third_party/highway \
		-I $(CODEC_DIR)/third_party/skcms \
		-I $(CODEC_DIR)/third_party/brunsli \
		-I $(CODEC_DIR)/third_party/brunsli/c/include \
		${CXXFLAGS} \
		${LDFLAGS} \
		--bind \
		--closure 1 \
		-s ALLOW_MEMORY_GROWTH=1 \
		-s MODULARIZE=1 \
		-s TEXTDECODER=2 \
		-s ENVIRONMENT='worker' \
		-s EXPORT_ES6=1 \
		-s EXPORT_NAME="$(basename $(@F))" \
		-o $@ \
		$+ \
		$(CODEC_BUILD_DIR)/artifacts/libbrunslienc-static.bc \
		$(CODEC_BUILD_DIR)/artifacts/libbrunslicommon-static.bc \
		$(CODEC_BUILD_DIR)/artifacts/libbrunslidec-static.bc \
		$(CODEC_BUILD_DIR)/third_party/brotli/libbrotlidec-static.a \
		$(CODEC_BUILD_DIR)/third_party/brotli/libbrotlienc-static.a \
		$(CODEC_BUILD_DIR)/third_party/brotli/libbrotlicommon-static.a \
		$(CODEC_BUILD_DIR)/third_party/libskcms.a \
		$(CODEC_BUILD_DIR)/third_party/highway/libhwy.a

$(CODEC_OUT): $(CODEC_DIR)/CMakeLists.txt
	mkdir -p $(CODEC_BUILD_DIR)
	cd $(CODEC_BUILD_DIR) && \
	emcmake cmake ../ && \
	$(MAKE) jxl-static

$(CODEC_DIR)/CMakeLists.txt: $(CODEC_DIR)

$(CODEC_DIR):
	mkdir -p $@
	git clone $(CODEC_URL) --recursive -j`nproc` --depth 1 --branch $(CODEC_VERSION) $@

clean:
	$(RM) $(OUT_JS) $(OUT_WASM)
	$(MAKE) -C $(CODEC_BUILD_DIR) clean
