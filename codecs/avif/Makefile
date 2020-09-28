CODEC_URL = https://github.com/AOMediaCodec/libavif/archive/v0.8.1.tar.gz
CODEC_PACKAGE = node_modules/libavif.tar.gz

LIBAOM_URL = https://aomedia.googlesource.com/aom/+archive/v2.0.0.tar.gz
LIBAOM_PACKAGE = node_modules/libaom.tar.gz

CODEC_ENC_DIR = node_modules/libavif-enc
CODEC_ENC_MT_DIR = node_modules/libavif-enc-mt
CODEC_DEC_DIR = node_modules/libavif-dec
LIBAOM_DIR = node_modules/libaom

OUT_ENC_JS = enc/avif_enc.js
OUT_ENC_MT_JS = enc/avif_enc_mt.js
OUT_DEC_JS = dec/avif_dec.js

OUT_ENC_CPP = enc/avif_enc.cpp
OUT_DEC_CPP = dec/avif_dec.cpp

HELPER_MAKEFLAGS := -f helper.Makefile \
	LIBAOM_DIR=$(LIBAOM_DIR) \
	CODEC_PACKAGE=$(CODEC_PACKAGE) \
	LIBAOM_PACKAGE=$(LIBAOM_PACKAGE)

.PHONY: all clean

all: $(OUT_ENC_JS) $(OUT_DEC_JS) $(OUT_ENC_MT_JS)

$(OUT_ENC_JS): $(OUT_ENC_CPP) $(CODEC_PACKAGE) $(LIBAOM_DIR)/CMakeLists.txt
	$(MAKE) \
		$(HELPER_MAKEFLAGS) \
		CODEC_DIR=$(CODEC_ENC_DIR) \
		OUT_JS=$@ \
		OUT_CPP=$< \
		LIBAOM_FLAGS="\
			-DCONFIG_AV1_DECODER=0 \
			-DCONFIG_MULTITHREAD=0 \
			-DCONFIG_AV1_HIGHBITDEPTH=0 \
		"

$(OUT_ENC_MT_JS): $(OUT_ENC_CPP) $(CODEC_PACKAGE) $(LIBAOM_DIR)/CMakeLists.txt
	$(MAKE) \
		$(HELPER_MAKEFLAGS) \
		CODEC_DIR=$(CODEC_ENC_MT_DIR) \
		OUT_JS=$@ \
		OUT_CPP=$< \
		LIBAOM_FLAGS="\
			-DCONFIG_AV1_DECODER=0 \
			-DCONFIG_AV1_HIGHBITDEPTH=0 \
		" \
		OUT_FLAGS="-pthread"

$(OUT_DEC_JS): $(OUT_DEC_CPP) $(CODEC_PACKAGE) $(LIBAOM_DIR)/CMakeLists.txt
	$(MAKE) \
		$(HELPER_MAKEFLAGS) \
		CODEC_DIR=$(CODEC_DEC_DIR) \
		OUT_JS=$@ \
		OUT_CPP=$< \
		LIBAOM_FLAGS="\
			-DCONFIG_AV1_ENCODER=0 \
			-DCONFIG_MULTITHREAD=0 \
		"

$(CODEC_PACKAGE):
	mkdir -p $(@D)
	curl -sL $(CODEC_URL) -o $@

$(LIBAOM_PACKAGE):
	mkdir -p $(@D)
	curl -sL $(LIBAOM_URL) -o $@

$(LIBAOM_DIR)/CMakeLists.txt: $(LIBAOM_PACKAGE)
	mkdir -p $(@D)
	tar xzm -C $(@D) -f $(LIBAOM_PACKAGE)

clean:
	$(MAKE) $(HELPER_MAKEFLAGS) CODEC_DIR=$(CODEC_ENC_DIR) OUT_JS=$(OUT_ENC_JS) clean
	$(MAKE) $(HELPER_MAKEFLAGS) CODEC_DIR=$(CODEC_ENC_MT_DIR) OUT_JS=$(OUT_ENC_MT_JS) clean
	$(MAKE) $(HELPER_MAKEFLAGS) CODEC_DIR=$(CODEC_DEC_DIR) OUT_JS=$(OUT_DEC_JS) clean
