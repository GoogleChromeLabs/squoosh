CODEC_URL := https://github.com/mozilla/mozjpeg/archive/v3.3.1.tar.gz
CODEC_DIR := node_modules/mozjpeg
CODEC_OUT_RELATIVE := .libs/libjpeg.a rdswitch.o
CODEC_OUT := $(addprefix $(CODEC_DIR)/, $(CODEC_OUT_RELATIVE))
OUT_JS := mozjpeg_enc.js
OUT_WASM := $(OUT_JS:.js=.wasm)

.PHONY: all clean

all: $(OUT_JS)

%.js: %.cpp $(CODEC_OUT)
	$(CXX) \
		-I $(CODEC_DIR) \
		${CXXFLAGS} \
		${LDFLAGS} \
		--closure 1 \
		--bind \
		-s ALLOW_MEMORY_GROWTH=1 \
		-s MODULARIZE=1 \
		-s TEXTDECODER=2 \
		-s ENVIRONMENT='worker' \
		-s EXPORT_ES6=1 \
		-o $@ \
		$+

# This one is a bit special: there is no rule for .libs/libjpeg.a
#  so we use libjpeg.la which implicitly builds that one instead.
$(CODEC_DIR)/.libs/libjpeg.a: $(CODEC_DIR)/Makefile
	$(MAKE) -C $(CODEC_DIR) libjpeg.la

$(CODEC_DIR)/rdswitch.o: $(CODEC_DIR)/Makefile
	$(MAKE) -C $(CODEC_DIR) rdswitch.o

$(CODEC_DIR)/Makefile: $(CODEC_DIR)/configure
	cd $(CODEC_DIR) && ./configure \
		--disable-shared \
		--without-turbojpeg \
		--without-simd \
		--without-arith-enc \
		--without-arith-dec

$(CODEC_DIR)/configure: $(CODEC_DIR)/configure.ac
	cd $(CODEC_DIR) && autoreconf -iv

$(CODEC_DIR)/configure.ac: $(CODEC_DIR)

$(CODEC_DIR):
	mkdir -p $@
	curl -sL $(CODEC_URL) | tar xz --strip 1 -C $@

clean:
	$(RM) $(OUT_JS) $(OUT_WASM)
	$(MAKE) -C $(CODEC_DIR) clean
