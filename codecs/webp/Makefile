CODEC_URL := https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.0.2.tar.gz
CODEC_DIR = node_modules/libwebp
CODEC_OUT_RELATIVE = src/.libs/libwebp.a
CODEC_OUT := $(addprefix $(CODEC_DIR)/, $(CODEC_OUT_RELATIVE))
OUT_JS = enc/webp_enc.js dec/webp_dec.js
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
		-s 'EXPORT_NAME="$(basename $(@F))"' \
		-o $@ \
		$+

$(CODEC_OUT): $(CODEC_DIR)/src/Makefile
	$(MAKE) -C $(CODEC_DIR)/src

$(CODEC_DIR)/src/Makefile: $(CODEC_DIR)/configure
	cd $(CODEC_DIR) && ./configure \
		--disable-shared \
		--disable-libwebpdemux \
		--disable-wic \
		--disable-gif \
		--disable-tiff \
		--disable-jpeg \
		--disable-png \
		--disable-sdl \
		--disable-gl \
		--disable-threading \
		--disable-neon-rtcd \
		--disable-neon \
		--disable-sse2 \
		--disable-sse4.1

$(CODEC_DIR)/configure: $(CODEC_DIR)/configure.ac
	cd $(CODEC_DIR) && autoreconf -iv

$(CODEC_DIR)/configure.ac: $(CODEC_DIR)

$(CODEC_DIR):
	mkdir -p $@
	curl -sL $(CODEC_URL) | tar xz --strip 1 -C $@

clean:
	$(RM) $(OUT_JS) $(OUT_WASM)
	$(MAKE) -C $(CODEC_DIR) clean
