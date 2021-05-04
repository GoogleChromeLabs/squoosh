CODEC_URL := https://github.com/mozilla/mozjpeg/archive/v3.3.1.tar.gz
CODEC_DIR := node_modules/mozjpeg
CODEC_BUILD_DIR := $(CODEC_DIR)/build
CODEC_OUT_RELATIVE := .libs/libjpeg.a rdswitch.o
CODEC_OUT := $(addprefix $(CODEC_BUILD_DIR)/, $(CODEC_OUT_RELATIVE))

OUT_WASM := enc/mozjpeg_enc.wasm

OPTIMIZE := 3

override CC = $(WASI_SDK_PREFIX)/bin/clang
override CXX = $(WASI_SDK_PREFIX)/bin/clang++
override CXXFLAGS += --sysroot=$(WASI_SDK_PREFIX)/share/wasi-sysroot -O$(OPTIMIZE) 
override CFLAGS += --sysroot=$(WASI_SDK_PREFIX)/share/wasi-sysroot -O$(OPTIMIZE)
override RANLIB = $(WASI_SDK_PREFIX)/bin/ranlib

# Without this export, configure doesn’t seem to see $CC and $CFLAGS
export

.PHONY: all clean

all: $(OUT_WASM)

$(OUT_WASM): $(CODEC_OUT)
	$(CXX) \
		-I $(CODEC_BUILD_DIR) \
		-I $(CODEC_DIR) \
		${CXXFLAGS} \
		${LDFLAGS} \
		-o $@ \
		enc/mozjpeg_enc.cpp \
		$(CODEC_OUT)
	$(BINARYEN_PREFIX)/bin/wasm-opt -O4 -o $(OUT_WASM) $(OUT_WASM)
	$(WABT_PREFIX)/bin/wasm-strip $(OUT_WASM)

# This one is a bit special: there is no rule for .libs/libjpeg.a
#  so we use libjpeg.la which implicitly builds that one instead.
$(CODEC_BUILD_DIR)/.libs/libjpeg.a: $(CODEC_BUILD_DIR)/Makefile
	$(MAKE) -C $(CODEC_BUILD_DIR) libjpeg.la

$(CODEC_BUILD_DIR)/rdswitch.o: $(CODEC_BUILD_DIR)/Makefile
	$(MAKE) -C $(CODEC_BUILD_DIR) rdswitch.o

$(CODEC_BUILD_DIR)/Makefile: $(CODEC_DIR)/configure
	mkdir -p $(CODEC_BUILD_DIR) && \
	cd $(CODEC_BUILD_DIR) && \
	../configure \
		--target=wasm32-wasi \
		--host=wasm32-wasi \
		--disable-shared \
		--without-turbojpeg \
		--without-simd \
		--without-arith-enc \
		--without-arith-dec \
		--with-build-date=squoosh
		# ^ If not provided with a dummy value, MozJPEG includes a build date in the
		# binary as part of the version string, making binaries different each time.

$(CODEC_DIR)/configure: $(CODEC_DIR)/configure.ac
	cd $(CODEC_DIR) && autoreconf -iv

$(CODEC_DIR)/configure.ac: $(CODEC_DIR)

$(CODEC_DIR):
	mkdir -p $@
	curl -sL $(CODEC_URL) | tar xz --strip 1 -C $@
	cp $(WASI_SDK_PREFIX)/share/misc/config.* $(CODEC_DIR)
	# ^ Monkey-path autoconf files as Ubuntu’s autoconf tools are too old
  # to recognize WASI

clean:
	$(RM) $(OUT_WASM)
	$(RM) -r $(CODEC_BUILD_DIR)
