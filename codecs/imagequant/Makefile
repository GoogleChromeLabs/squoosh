CODEC_URL := https://github.com/ImageOptim/libimagequant/archive/2.12.1.tar.gz
CODEC_DIR := node_modules/libimagequant
CODEC_OUT_RELATIVE := libimagequant.a
CODEC_OUT := $(addprefix $(CODEC_DIR)/, $(CODEC_OUT_RELATIVE))
OUT_JS := imagequant.js imagequant_node.js
OUT_WASM := $(OUT_JS:.js=.wasm)
ENVIRONMENT = worker

.PHONY: all clean

all: $(OUT_JS)

imagequant_node.js: ENVIRONMENT=node
$(OUT_JS): $(CODEC_OUT)
	$(CXX) \
		-I $(CODEC_DIR) \
		${CXXFLAGS} \
		${LDFLAGS} \
		--bind \
		-s ENVIRONMENT=$(ENVIRONMENT) \
		-s EXPORT_ES6=1 \
		-o $@ \
		$+ \
		imagequant.cpp

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
