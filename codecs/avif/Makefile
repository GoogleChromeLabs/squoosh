# using libavif from https://github.com/AOMediaCodec/libavif
LIBAVIF_URL = https://github.com/AOMediaCodec/libavif/archive/refs/tags/v1.0.1.tar.gz
LIBAVIF_PACKAGE = node_modules/libavif.tar.gz

# using libaom from https://aomedia.googlesource.com/aom
LIBAOM_URL = https://aomedia.googlesource.com/aom/+archive/v3.7.0.tar.gz
LIBAOM_PACKAGE = node_modules/libaom.tar.gz

export CODEC_DIR = node_modules/libavif
export BUILD_DIR = node_modules/build
export LIBAOM_DIR = node_modules/libaom

override CFLAGS += "-Wno-unused-macros"

# We must build libsharpyuv from a specific libwebp commit
# See libavif/ext/libsharpyuv.cmd for more detail
LIBWEBP_URL_WITH_SHARPYUV = https://chromium.googlesource.com/webm/libwebp/+archive/e2c85878f6a33f29948b43d3492d9cdaf801aa54.tar.gz
LIBWEBP_DIR := $(CODEC_DIR)/ext/libwebp
LIBSHARPYUV_ST := $(LIBWEBP_DIR)/build_st/libsharpyuv.a
LIBSHARPYUV_MT := $(LIBWEBP_DIR)/build_mt/libsharpyuv.a
export LIBSHARPYUV := $(LIBWEBP_DIR)/build/libsharpyuv.a

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

all: $(OUT_ENC_JS) $(OUT_DEC_JS) $(OUT_ENC_MT_JS)

# ST-Encoding
$(OUT_ENC_JS): $(OUT_ENC_CPP) $(CODEC_DIR)/CMakeLists.txt $(LIBAOM_DIR)/CMakeLists.txt $(LIBSHARPYUV_ST)
	mkdir -p $(LIBWEBP_DIR)/build && cp $(LIBSHARPYUV_ST) $(LIBSHARPYUV)
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
		LIBAVIF_FLAGS="-DAVIF_CODEC_AOM_DECODE=0 -DAVIF_LOCAL_LIBSHARPYUV=ON"

# MT-Encoding
# We need to run the ST and MT tasks sequentially to avoid conflicts with the copy of libsharpyuv in the build directory
$(OUT_ENC_MT_JS): $(OUT_ENC_CPP) $(CODEC_DIR)/CMakeLists.txt $(LIBAOM_DIR)/CMakeLists.txt $(LIBSHARPYUV_MT) | $(OUT_ENC_JS)
	mkdir -p $(LIBWEBP_DIR)/build && cp $(LIBSHARPYUV_MT) $(LIBSHARPYUV)
	$(MAKE) \
		$(HELPER_MAKEFLAGS) \
		OUT_JS=$@ \
		OUT_CPP=$< \
		LIBAOM_FLAGS="\
			-DCONFIG_AV1_DECODER=0 \
			-DCONFIG_AV1_HIGHBITDEPTH=0 \
		" \
		ENVIRONMENT=$(ENVIRONMENT) \
		LIBAVIF_FLAGS="-DAVIF_CODEC_AOM_DECODE=0 -DAVIF_LOCAL_LIBSHARPYUV=ON" \
		OUT_FLAGS="-pthread"

# Decoding
$(OUT_DEC_JS): $(OUT_DEC_CPP) $(CODEC_DIR)/CMakeLists.txt $(LIBAOM_DIR)/CMakeLists.txt
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

# LIBAOM EXTRACTION SECTION

# Download the libaom tarball
$(LIBAOM_PACKAGE):
	mkdir -p $(@D)
	curl -sL $(LIBAOM_URL) -o $@

# Extract libaom from the tarball
$(LIBAOM_DIR)/CMakeLists.txt: $(LIBAOM_PACKAGE)
	mkdir -p $(@D)
	tar xzm -C $(@D) -f $(LIBAOM_PACKAGE)

# LIBAVIF EXTRACTION SECTION

# Download the libavif tarball
$(LIBAVIF_PACKAGE):
	mkdir -p $(@D)
	curl -sL $(LIBAVIF_URL) -o $@

# Extract libavif from the tarball
$(CODEC_DIR)/CMakeLists.txt: $(LIBAVIF_PACKAGE)
	mkdir -p $(@D)
	tar xzm --strip 1 -C $(@D) -f $(LIBAVIF_PACKAGE)

# Create libavif/ext/libwebp
$(LIBWEBP_DIR)/CMakeLists.txt: $(CODEC_DIR)/CMakeLists.txt
	mkdir -p $(LIBWEBP_DIR)
	curl -sL $(LIBWEBP_URL_WITH_SHARPYUV) \
		| tar xzm -C $(LIBWEBP_DIR)

# Make libsharpyuv.a for ST-Encoding
$(LIBSHARPYUV_ST): $(LIBWEBP_DIR)/CMakeLists.txt
	mkdir -p $(@D)
	emcmake cmake \
		-DWEBP_USE_THREAD=OFF \
		-DWEBP_BUILD_ANIM_UTILS=OFF \
		-DWEBP_BUILD_CWEBP=OFF \
		-DWEBP_BUILD_DWEBP=OFF \
		-DWEBP_BUILD_GIF2WEBP=OFF \
		-DWEBP_BUILD_IMG2WEBP=OFF \
		-DWEBP_BUILD_VWEBP=OFF \
		-DWEBP_BUILD_WEBPINFO=OFF \
		-DWEBP_BUILD_LIBWEBPMUX=OFF \
		-DWEBP_BUILD_WEBPMUX=OFF \
		-DWEBP_BUILD_EXTRAS=OFF \
		-DBUILD_SHARED_LIBS=OFF \
		-DCMAKE_BUILD_TYPE=Release \
		-S $(LIBWEBP_DIR) \
		-B $(@D)
	$(MAKE) -C $(@D) sharpyuv

# Make libsharpyuv.a for MT-Encoding
$(LIBSHARPYUV_MT): $(LIBWEBP_DIR)/CMakeLists.txt
	mkdir -p $(@D)
	emcmake cmake \
		-DWEBP_BUILD_ANIM_UTILS=OFF \
		-DWEBP_BUILD_CWEBP=OFF \
		-DWEBP_BUILD_DWEBP=OFF \
		-DWEBP_BUILD_GIF2WEBP=OFF \
		-DWEBP_BUILD_IMG2WEBP=OFF \
		-DWEBP_BUILD_VWEBP=OFF \
		-DWEBP_BUILD_WEBPINFO=OFF \
		-DWEBP_BUILD_LIBWEBPMUX=OFF \
		-DWEBP_BUILD_WEBPMUX=OFF \
		-DWEBP_BUILD_EXTRAS=OFF \
		-DBUILD_SHARED_LIBS=OFF \
		-DCMAKE_BUILD_TYPE=Release \
		-S $(LIBWEBP_DIR) \
		-B $(@D)
	$(MAKE) -C $(@D) sharpyuv

clean:
	$(MAKE) $(HELPER_MAKEFLAGS) OUT_JS=$(OUT_ENC_JS) clean
	$(MAKE) $(HELPER_MAKEFLAGS) OUT_JS=$(OUT_ENC_MT_JS) clean
	$(MAKE) $(HELPER_MAKEFLAGS) OUT_JS=$(OUT_ENC_NODE_JS) clean
	$(MAKE) $(HELPER_MAKEFLAGS) OUT_JS=$(OUT_ENC_NODE_MT_JS) clean
	$(MAKE) $(HELPER_MAKEFLAGS) OUT_JS=$(OUT_DEC_JS) clean
	$(MAKE) $(HELPER_MAKEFLAGS) OUT_JS=$(OUT_DEV_NODE_JS) clean
