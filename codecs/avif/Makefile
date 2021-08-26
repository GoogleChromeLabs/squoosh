# libavif and libaom versions are from
# https://docs.google.com/document/d/1wEEA5rRU7wT54k41u3qyZIZHDCJArIMzLuzsrLAwaK8/edit
CODEC_URL = https://github.com/AOMediaCodec/libavif/archive/1c39e772c2c0d687691dd4b589a12c323f5f767d.tar.gz
CODEC_PACKAGE = node_modules/libavif.tar.gz

LIBAOM_URL = https://aomedia.googlesource.com/aom/+archive/v3.1.0.tar.gz
LIBAOM_PACKAGE = node_modules/libaom.tar.gz

export CODEC_DIR = node_modules/libavif
export BUILD_DIR = node_modules/build
export LIBAOM_DIR = node_modules/libaom

override CFLAGS += "-Wno-unused-macros"
export

OUT_ENC_JS = enc/avif_enc.js
OUT_NODE_ENC_JS = enc/avif_node_enc.js
OUT_ENC_MT_JS = enc/avif_enc_mt.js
OUT_NODE_ENC_MT_JS = enc/avif_node_enc_mt.js
OUT_DEC_JS = dec/avif_dec.js
OUT_NODE_DEC_JS = dec/avif_node_dec.js

OUT_ENC_CPP = enc/avif_enc.cpp
OUT_DEC_CPP = dec/avif_dec.cpp
ENVIRONMENT = worker

HELPER_MAKEFLAGS := -f helper.Makefile

.PHONY: all clean

all: $(OUT_ENC_JS) $(OUT_DEC_JS) $(OUT_ENC_MT_JS) $(OUT_NODE_ENC_JS) $(OUT_NODE_ENC_MT_JS) $(OUT_NODE_DEC_JS)

$(OUT_NODE_ENC_JS) $(OUT_NODE_ENC_MT_JS): ENVIRONMENT=node
$(OUT_NODE_ENC_JS) $(OUT_ENC_JS): $(OUT_ENC_CPP) $(CODEC_DIR)/CMakeLists.txt $(LIBAOM_DIR)/CMakeLists.txt
	$(MAKE) \
		$(HELPER_MAKEFLAGS) \
		OUT_JS=$@ \
		OUT_CPP=$< \
		LIBAOM_FLAGS="\
			-DCONFIG_AV1_DECODER=0 \
			-DCONFIG_MULTITHREAD=0 \
			-DCONFIG_AV1_HIGHBITDEPTH=0 \
		" \
		ENVIRONMENT=$(ENVIRONMENT) \
		LIBAVIF_FLAGS="-DAVIF_CODEC_AOM_DECODE=0"

$(OUT_ENC_MT_JS) $(OUT_NODE_ENC_MT_JS): $(OUT_ENC_CPP) $(CODEC_DIR)/CMakeLists.txt $(LIBAOM_DIR)/CMakeLists.txt
	$(MAKE) \
		$(HELPER_MAKEFLAGS) \
		OUT_JS=$@ \
		OUT_CPP=$< \
		LIBAOM_FLAGS="\
			-DCONFIG_AV1_DECODER=0 \
			-DCONFIG_AV1_HIGHBITDEPTH=0 \
		" \
		ENVIRONMENT=$(ENVIRONMENT) \
		LIBAVIF_FLAGS="-DAVIF_CODEC_AOM_DECODE=0" \
		OUT_FLAGS="-pthread"

$(OUT_NODE_DEC_JS): ENVIRONMENT=node
$(OUT_NODE_DEC_JS) $(OUT_DEC_JS): $(OUT_DEC_CPP) $(CODEC_DIR)/CMakeLists.txt $(LIBAOM_DIR)/CMakeLists.txt
	$(MAKE) \
		$(HELPER_MAKEFLAGS) \
		OUT_JS=$@ \
		OUT_CPP=$< \
		LIBAOM_FLAGS="\
			-DCONFIG_AV1_ENCODER=0 \
			-DCONFIG_MULTITHREAD=0 \
		" \
		ENVIRONMENT=$(ENVIRONMENT) \
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
	$(MAKE) $(HELPER_MAKEFLAGS) OUT_JS=$(OUT_ENC_JS) clean
	$(MAKE) $(HELPER_MAKEFLAGS) OUT_JS=$(OUT_ENC_MT_JS) clean
	$(MAKE) $(HELPER_MAKEFLAGS) OUT_JS=$(OUT_ENC_NODE_JS) clean
	$(MAKE) $(HELPER_MAKEFLAGS) OUT_JS=$(OUT_ENC_NODE_MT_JS) clean
	$(MAKE) $(HELPER_MAKEFLAGS) OUT_JS=$(OUT_DEC_JS) clean
	$(MAKE) $(HELPER_MAKEFLAGS) OUT_JS=$(OUT_DEV_NODE_JS) clean
