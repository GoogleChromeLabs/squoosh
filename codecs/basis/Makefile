CODEC_URL := https://github.com/BinomialLLC/basis_universal/archive/refs/tags/v1.15_rel2.tar.gz
CODEC_DIR := node_modules/basis
BUILD_DIR := build
ENVIRONMENT = node

OUT_JS := enc/basis_enc.js # enc/basis_node_enc.js
OUT_WASM := $(OUT_JS:.js=.wasm)

CODEC_CPP_SOURCE_FILES := \
	encoder/basisu_comp.cpp \
	encoder/basisu_enc.cpp \
	encoder/basisu_backend.cpp \
	encoder/basisu_basis_file.cpp \
	encoder/basisu_etc.cpp \
	encoder/basisu_uastc_enc.cpp \
	encoder/basisu_gpu_texture.cpp \
	encoder/basisu_frontend.cpp \
	encoder/basisu_bc7enc.cpp \
	encoder/basisu_pvrtc1_4.cpp \
	encoder/basisu_astc_decomp.cpp \
	encoder/basisu_global_selector_palette_helpers.cpp \
	encoder/basisu_resampler.cpp \
	encoder/jpgd.cpp \
	encoder/lodepng.cpp \
	transcoder/basisu_transcoder.cpp

CODEC_C_SOURCE_FILES := \
	encoder/apg_bmp.c \
	zstd/zstd.c

CODEC_CPP_OBJECT_FILES := $(CODEC_CPP_SOURCE_FILES:.cpp=.o)
CODEC_C_OBJECT_FILES := $(CODEC_C_SOURCE_FILES:.c=.o)
CODEC_CPP_OBJECT_FILE_PATHS := $(addprefix $(CODEC_DIR)/, $(CODEC_CPP_OBJECT_FILES))
CODEC_C_OBJECT_FILE_PATHS := $(addprefix $(CODEC_DIR)/, $(CODEC_C_OBJECT_FILES))

.PHONY: all clean

all: $(OUT_JS)

# Define dependencies for all variations of build artifacts.
$(filter enc/%,$(OUT_JS)): enc/basis_enc.cpp
# $(filter dec/%,$(OUT_JS)): dec/mozjpeg_dec.cpp

# enc/mozjpeg_node_enc.js dec/mozjpeg_node_dec.js: ENVIRONMENT = node

%.js: $(CODEC_CPP_OBJECT_FILE_PATHS) $(CODEC_C_OBJECT_FILE_PATHS)
	$(CXX) \
		-I $(CODEC_DIR)/encoder \
		${CXXFLAGS} \
		${LDFLAGS} \
		--closure 1 \
		--bind \
		-s ALLOW_MEMORY_GROWTH=1 \
		-s MODULARIZE=1 \
		-s TEXTDECODER=2 \
		-s ENVIRONMENT=$(ENVIRONMENT) \
		-s EXPORT_ES6=1 \
		-o $@ \
		$+ 

$(CODEC_CPP_OBJECT_FILES): $(CODEC_DIR)
	$(CXX) \
		-o $@ \
		-c $(@:.o=.cpp)

$(CODEC_C_OBJECT_FILES): $(CODEC_DIR)
	$(CC) \
		-o $@ \
		-c $(@:.o=.c)

$(CODEC_DIR):
	mkdir -p $@
	curl -sL $(CODEC_URL) | tar xz --strip 1 -C $@

clean:
	$(RM) $(OUT_JS) $(OUT_WASM)
