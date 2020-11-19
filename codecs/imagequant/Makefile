CODEC_URL := https://github.com/ImageOptim/libimagequant/archive/2.12.1.tar.gz
CODEC_DIR := node_modules/libimagequant
CODEC_OUT_RELATIVE := libimagequant.a
CODEC_OUT := $(addprefix $(CODEC_DIR)/, $(CODEC_OUT_RELATIVE))
OUT_JS := imagequant.js
OUT_WASM := $(OUT_JS:.js=.wasm)

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

$(CODEC_OUT): $(CODEC_DIR)/config.mk
	$(MAKE) -C $(CODEC_DIR) $(CODEC_OUT_RELATIVE)

$(CODEC_DIR)/config.mk: $(CODEC_DIR)/configure
	cd $(CODEC_DIR) && ./configure \
		--disable-sse

$(CODEC_DIR)/configure: $(CODEC_DIR)

$(CODEC_DIR):
	mkdir -p $@
	curl -sL $(CODEC_URL) | tar xz --strip 1 -C $@

clean:
	$(RM) $(OUT_JS) $(OUT_WASM)
	$(MAKE) -C $(CODEC_DIR) clean
