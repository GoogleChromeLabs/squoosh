CODEC_URL = https://chromium.googlesource.com/codecs/libwebp2/+archive/c90b5b476004c9a98731ae1c175cebab5de50fbf.tar.gz
CODEC_DIR = node_modules/wp2
CODEC_BUILD_DIR := $(CODEC_DIR)/.build
CODEC_OUT := $(CODEC_BUILD_DIR)/libwebp2.a

OUT_JS = enc/wp2_enc.js dec/wp2_dec.js
OUT_WASM = $(OUT_JS:.js=.wasm)

.PHONY: all clean

all: $(OUT_JS)

%.js: %.cpp $(CODEC_OUT)
	$(CXX) \
		-I $(CODEC_DIR) \
		${CXXFLAGS} \
		${LDFLAGS} \
		--bind \
		--closure 1 \
		-s ALLOW_MEMORY_GROWTH=1 \
		-s MODULARIZE=1 \
		-s TEXTDECODER=2 \
		-s ENVIRONMENT='worker' \
		-s EXPORT_ES6=1 \
		-o $@ \
		$+

$(CODEC_OUT): $(CODEC_BUILD_DIR)/Makefile
	cd $(CODEC_BUILD_DIR) && \
	$(MAKE)

$(CODEC_BUILD_DIR)/Makefile: $(CODEC_DIR)/CMakeLists.txt
	mkdir -p $(CODEC_BUILD_DIR)
	cd $(CODEC_BUILD_DIR) && \
	emcmake cmake \
		-DWP2_ENABLE_SIMD=0 \
		-DWP2_BUILD_TESTS=0 \
		-DWP2_ENABLE_TESTS=0 \
		-DWP2_BUILD_EXAMPLES=0 \
		-DWP2_BUILD_EXTRAS=0 \
		../

$(CODEC_DIR)/CMakeLists.txt:
	mkdir -p $(CODEC_DIR)
	curl -sL $(CODEC_URL) | tar xz -C $(CODEC_DIR)

clean:
	$(RM) $(OUT_JS) $(OUT_WASM)
	$(MAKE) -C $(CODEC_BUILD_DIR) clean
