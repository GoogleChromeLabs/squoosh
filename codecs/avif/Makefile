CODEC_URL = https://github.com/AOMediaCodec/libavif/archive/v0.8.1.tar.gz
CODEC_PACKAGE = node_modules/libavif.tar.gz

CODEC_ENC_DIR = node_modules/libavif-enc
CODEC_ENC_BUILD_DIR := $(CODEC_ENC_DIR)/build
CODEC_ENC_OUT := $(CODEC_ENC_BUILD_DIR)/libavif.a

CODEC_DEC_DIR = node_modules/libavif-dec
CODEC_DEC_BUILD_DIR := $(CODEC_DEC_DIR)/build
CODEC_DEC_OUT := $(CODEC_DEC_BUILD_DIR)/libavif.a

LIBAOM_URL = https://aomedia.googlesource.com/aom/+archive/v2.0.0.tar.gz
LIBAOM_PACKAGE = node_modules/libaom.tar.gz

LIBAOM_ENC_DIR := $(CODEC_ENC_DIR)/ext/aom
LIBAOM_ENC_BUILD_DIR := $(LIBAOM_ENC_DIR)/build.libavif
LIBAOM_ENC_OUT := $(LIBAOM_ENC_BUILD_DIR)/libaom.a

LIBAOM_DEC_DIR := $(CODEC_DEC_DIR)/ext/aom
LIBAOM_DEC_BUILD_DIR := $(LIBAOM_DEC_DIR)/build.libavif
LIBAOM_DEC_OUT := $(LIBAOM_DEC_BUILD_DIR)/libaom.a

OUT_ENC_JS = enc/avif_enc.js
OUT_ENC_CPP = $(OUT_ENC_JS:.js=.cpp)
OUT_ENC_WASM = $(OUT_ENC_JS:.js=.wasm)

OUT_DEC_JS = dec/avif_dec.js
OUT_DEC_CPP = $(OUT_DEC_JS:.js=.cpp)
OUT_DEC_WASM = $(OUT_DEC_JS:.js=.wasm)

# ERROR_ON_UNDEFINED_SYMBOLS=0 is needed to seperate the encoder and decoder
EMSCRIPTEN_FLAGS = ${CXXFLAGS} \
	${LDFLAGS} \
	--bind \
	--closure 1 \
	-s ALLOW_MEMORY_GROWTH=1 \
	-s MODULARIZE=1 \
	-s ERROR_ON_UNDEFINED_SYMBOLS=0

CODEC_EMCMAKE = emcmake cmake \
	-DCMAKE_BUILD_TYPE=Release \
	-DBUILD_SHARED_LIBS=0 \
	-DAVIF_CODEC_AOM=1 \
	-DAVIF_LOCAL_AOM=1 \
	../

LIBAOM_FLAGS = -DCMAKE_BUILD_TYPE=Release \
	-DENABLE_CCACHE=0 \
	-DAOM_TARGET_CPU=generic \
	-DENABLE_DOCS=0 \
	-DENABLE_TESTS=0 \
	-DENABLE_EXAMPLES=0 \
	-DENABLE_TOOLS=0 \
	-DCONFIG_ACCOUNTING=1 \
	-DCONFIG_INSPECTION=0 \
	-DCONFIG_MULTITHREAD=0 \
	-DCONFIG_RUNTIME_CPU_DETECT=0 \
	-DCONFIG_WEBM_IO=0

.PHONY: all clean

all: $(OUT_ENC_JS) $(OUT_DEC_JS)

$(OUT_ENC_JS): $(OUT_ENC_CPP) $(LIBAOM_ENC_OUT) $(CODEC_ENC_OUT)
	$(CXX) \
		-I $(CODEC_ENC_DIR)/include \
		${EMSCRIPTEN_FLAGS} \
		-s 'EXPORT_NAME="$(basename $(@F))"' \
		-o $@ \
		$+

$(OUT_DEC_JS): $(OUT_DEC_CPP) $(LIBAOM_DEC_OUT) $(CODEC_DEC_OUT)
	$(CXX) \
		-I $(CODEC_DEC_DIR)/include \
		${EMSCRIPTEN_FLAGS} \
		-s 'EXPORT_NAME="$(basename $(@F))"' \
		-o $@ \
		$+

$(CODEC_ENC_OUT): $(CODEC_ENC_DIR)/CMakeLists.txt $(LIBAOM_ENC_OUT)
	mkdir -p $(CODEC_ENC_BUILD_DIR)
	cd $(CODEC_ENC_BUILD_DIR) && \
	$(CODEC_EMCMAKE) && \
	$(MAKE)

$(CODEC_DEC_OUT): $(CODEC_DEC_DIR)/CMakeLists.txt $(LIBAOM_DEC_OUT)
	mkdir -p $(CODEC_DEC_BUILD_DIR)
	cd $(CODEC_DEC_BUILD_DIR) && \
	$(CODEC_EMCMAKE) && \
	$(MAKE)

$(LIBAOM_ENC_OUT): $(LIBAOM_ENC_DIR)/CMakeLists.txt
	mkdir -p $(LIBAOM_ENC_BUILD_DIR)
	cd $(LIBAOM_ENC_BUILD_DIR) && \
	emcmake cmake \
		$(LIBAOM_FLAGS) \
		-DCONFIG_AV1_DECODER=0 \
		-DCONFIG_AV1_HIGHBITDEPTH=0 \
		../ && \
	$(MAKE)

$(LIBAOM_DEC_OUT): $(LIBAOM_DEC_DIR)/CMakeLists.txt
	mkdir -p $(LIBAOM_DEC_BUILD_DIR)
	cd $(LIBAOM_DEC_BUILD_DIR) && \
	emcmake cmake \
		$(LIBAOM_FLAGS) \
		-DCONFIG_AV1_ENCODER=0 \
		../ && \
	$(MAKE)

$(CODEC_ENC_DIR)/CMakeLists.txt: $(CODEC_ENC_DIR)
$(CODEC_DEC_DIR)/CMakeLists.txt: $(CODEC_DEC_DIR)

$(LIBAOM_ENC_DIR)/CMakeLists.txt: $(LIBAOM_ENC_DIR)
$(LIBAOM_DEC_DIR)/CMakeLists.txt: $(LIBAOM_DEC_DIR)

$(CODEC_PACKAGE):
	curl -sL $(CODEC_URL) -o $@

$(LIBAOM_PACKAGE):
	curl -sL $(LIBAOM_URL) -o $@

$(CODEC_ENC_DIR) $(CODEC_DEC_DIR): $(CODEC_PACKAGE)
	mkdir -p $@
	tar xz --strip 1 -C $@ -f $(CODEC_PACKAGE)

$(LIBAOM_ENC_DIR) $(LIBAOM_DEC_DIR): $(LIBAOM_PACKAGE)
	mkdir -p $@
	tar xz -C $@ -f $(LIBAOM_PACKAGE)

clean:
	$(RM) $(LIBAOM_PACKAGE) $(CODEC_PACKAGE) $(OUT_ENC_JS) $(OUT_ENC_WASM) $(OUT_DEC_JS) $(OUT_DEC_WASM)
	$(MAKE) -C $(CODEC_ENC_BUILD_DIR) clean
	$(MAKE) -C $(CODEC_DEC_BUILD_DIR) clean
	$(MAKE) -C $(LIBAOM_ENC_BUILD_DIR) clean
	$(MAKE) -C $(LIBAOM_DEC_BUILD_DIR) clean
