CODEC_URL = https://gitlab.com/wg1/jpeg-xl.git
CODEC_VERSION = c8ce59f8ef6393ba3018917791d04662cbf1172a
CODEC_DIR = node_modules/jxl
CODEC_BUILD_DIR := $(CODEC_DIR)/build
CODEC_OUT := $(CODEC_BUILD_DIR)/libjpegxl-static.a

OUT_JS = enc/jxl_enc.js dec/jxl_dec.js
OUT_WASM = $(OUT_JS:.js=.wasm)

.PHONY: all clean

all: $(OUT_JS)

%.js: %.cpp $(LIBAOM_OUT) $(CODEC_OUT)
	$(CXX) \
		-I $(CODEC_DIR) \
		-I $(CODEC_DIR)/third_party/highway \
		-I $(CODEC_DIR)/third_party/brunsli \
		-I $(CODEC_DIR)/third_party/brunsli/c/include \
		${CXXFLAGS} \
		${LDFLAGS} \
		--bind \
		--closure 1 \
		-s ALLOW_MEMORY_GROWTH=1 \
		-s MODULARIZE=1 \
		-s 'EXPORT_NAME="$(basename $(@F))"' \
		-o $@ \
		$+ \
		$(CODEC_BUILD_DIR)/artifacts/libbrunslienc-static.bc \
		$(CODEC_BUILD_DIR)/artifacts/libbrunslicommon-static.bc \
		$(CODEC_BUILD_DIR)/artifacts/libbrunslidec-static.bc \
		$(CODEC_BUILD_DIR)/third_party/brotli/libbrotlidec-static.a \
		$(CODEC_BUILD_DIR)/third_party/brotli/libbrotlienc-static.a \
		$(CODEC_BUILD_DIR)/third_party/brotli/libbrotlicommon-static.a \
		$(CODEC_BUILD_DIR)/third_party/libskcms.a \
		$(CODEC_BUILD_DIR)/third_party/highway/libhwy.a

$(CODEC_OUT): $(CODEC_DIR)/CMakeLists.txt
	mkdir -p $(CODEC_BUILD_DIR)
	cd $(CODEC_BUILD_DIR) && \
	emcmake cmake ../ && \
	$(MAKE) jpegxl-static

$(CODEC_DIR)/CMakeLists.txt: $(CODEC_DIR)

$(CODEC_DIR):
	# The JXL repository doesn’t have version tags or anything yet,
	# so we have to pin to a specific commit for now. This implies we
	# can’t use --recursive, as we will change commit after checkout (it
	# seems you can’t clone a specific commit directly), and it also means
	# we can’t use --depth 1 because we want to change commits.
	# The JXL code base also relies on submodules so we can’t just download
	# a .tar.gz from GitLab.
	mkdir -p $@
	git clone $(CODEC_URL) $@
	cd $@ && \
	git reset --hard $(CODEC_VERSION) && \
	git submodule update --init --recursive

clean:
	$(RM) $(OUT_JS) $(OUT_WASM)
	$(MAKE) -C $(CODEC_BUILD_DIR) clean
