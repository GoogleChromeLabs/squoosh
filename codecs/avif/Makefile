CODEC_URL = https://github.com/AOMediaCodec/libavif/archive/31d7c6d1e32cf467ac24fb8c7a76c4902a4c00db.tar.gz
CODEC_PACKAGE = node_modules/libavif.tar.gz

LIBAOM_URL = https://aomedia.googlesource.com/aom/+archive/v2.0.0.tar.gz
LIBAOM_PACKAGE = node_modules/libaom.tar.gz

CODEC_DIR = node_modules/libavif
BUILD_DIR := node_modules/build
ENC_BUILD_DIR := $(BUILD_DIR)/enc
ENC_MT_BUILD_DIR := $(BUILD_DIR)/enc-mt
DEC_BUILD_DIR := $(BUILD_DIR)/dec
LIBAOM_DIR = node_modules/libaom

OUT_ENC_JS = enc/avif_enc.js
OUT_ENC_MT_JS = enc/avif_enc_mt.js
OUT_DEC_JS = dec/avif_dec.js

OUT_ENC_CPP = enc/avif_enc.cpp
OUT_DEC_CPP = dec/avif_dec.cpp

HELPER_MAKEFLAGS := -f helper.Makefile \
	CODEC_DIR=$(CODEC_DIR) \
	LIBAOM_DIR=$(LIBAOM_DIR)

.PHONY: all clean

all: $(OUT_ENC_JS) $(OUT_DEC_JS) $(OUT_ENC_MT_JS)

$(OUT_ENC_JS): $(OUT_ENC_CPP) $(CODEC_DIR)/CMakeLists.txt $(LIBAOM_DIR)/CMakeLists.txt
	$(MAKE) \
		$(HELPER_MAKEFLAGS) \
		BUILD_DIR=$(ENC_BUILD_DIR) \
		OUT_JS=$@ \
		OUT_CPP=$< \
		LIBAOM_FLAGS="\
			-DCONFIG_AV1_DECODER=0 \
			-DCONFIG_MULTITHREAD=0 \
			-DCONFIG_AV1_HIGHBITDEPTH=0 \
		" \
		LIBAVIF_FLAGS="-DAVIF_CODEC_AOM_DECODE=0"

$(OUT_ENC_MT_JS): $(OUT_ENC_CPP) $(CODEC_DIR)/CMakeLists.txt $(LIBAOM_DIR)/CMakeLists.txt
	$(MAKE) \
		$(HELPER_MAKEFLAGS) \
		BUILD_DIR=$(ENC_MT_BUILD_DIR) \
		OUT_JS=$@ \
		OUT_CPP=$< \
		LIBAOM_FLAGS="\
			-DCONFIG_AV1_DECODER=0 \
			-DCONFIG_AV1_HIGHBITDEPTH=0 \
		" \
		LIBAVIF_FLAGS="-DAVIF_CODEC_AOM_DECODE=0" \
		OUT_FLAGS="-pthread"

$(OUT_DEC_JS): $(OUT_DEC_CPP) $(CODEC_DIR)/CMakeLists.txt $(LIBAOM_DIR)/CMakeLists.txt
	$(MAKE) \
		$(HELPER_MAKEFLAGS) \
		BUILD_DIR=$(DEC_BUILD_DIR) \
		OUT_JS=$@ \
		OUT_CPP=$< \
		LIBAOM_FLAGS="\
			-DCONFIG_AV1_ENCODER=0 \
			-DCONFIG_MULTITHREAD=0 \
		" \
		LIBAVIF_FLAGS="-DAVIF_CODEC_AOM_ENCODE=0"

$(CODEC_PACKAGE):
	mkdir -p $(@D)
	curl -sL $(CODEC_URL) -o $@

$(LIBAOM_PACKAGE):
	mkdir -p $(@D)
	curl -sL $(LIBAOM_URL) -o $@

$(CODEC_DIR)/CMakeLists.txt: $(CODEC_PACKAGE)
	mkdir -p $(@D)
	tar xzm --strip 1 -C $(@D) -f $(CODEC_PACKAGE)

$(LIBAOM_DIR)/CMakeLists.txt: $(LIBAOM_PACKAGE)
	mkdir -p $(@D)
	tar xzm -C $(@D) -f $(LIBAOM_PACKAGE)

clean:
	$(MAKE) $(HELPER_MAKEFLAGS) BUILD_DIR=$(ENC_BUILD_DIR) OUT_JS=$(OUT_ENC_JS) clean
	$(MAKE) $(HELPER_MAKEFLAGS) BUILD_DIR=$(ENC_MT_BUILD_DIR) OUT_JS=$(OUT_ENC_MT_JS) clean
	$(MAKE) $(HELPER_MAKEFLAGS) BUILD_DIR=$(DEC_BUILD_DIR) OUT_JS=$(OUT_DEC_JS) clean
