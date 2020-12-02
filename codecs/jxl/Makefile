CODEC_URL = https://gitlab.com/wg1/jpeg-xl.git
CODEC_VERSION = v0.1
CODEC_DIR = node_modules/jxl
CODEC_BUILD_ROOT := $(CODEC_DIR)/build
CODEC_MT_BUILD_DIR := $(CODEC_BUILD_ROOT)/mt
CODEC_MT_SIMD_BUILD_DIR := $(CODEC_BUILD_ROOT)/mt-simd

OUT_JS = enc/jxl_enc.js enc/jxl_enc_mt.js enc/jxl_enc_mt_simd.js dec/jxl_dec.js
OUT_WASM = $(OUT_JS:.js=.wasm)
OUT_WORKER = $(OUT_JS:.js=.worker.js)

.PHONY: all clean

all: $(OUT_JS)

# Define dependencies for all variations of build artifacts.
$(filter enc/%,$(OUT_JS)): enc/jxl_enc.cpp
$(filter dec/%,$(OUT_JS)): dec/jxl_dec.cpp

# For single-threaded build, we compile with threads enabled, but then just don't use them nor link them in.
enc/jxl_enc.js enc/jxl_enc_mt.js dec/jxl_dec.js: CODEC_BUILD_DIR:=$(CODEC_MT_BUILD_DIR)
enc/jxl_enc_mt_simd.js: CODEC_BUILD_DIR:=$(CODEC_MT_SIMD_BUILD_DIR)

enc/jxl_enc.js dec/jxl_dec.js: $(CODEC_MT_BUILD_DIR)/lib/libjxl.a
enc/jxl_enc_mt.js: $(CODEC_MT_BUILD_DIR)/lib/libjxl.a $(CODEC_MT_BUILD_DIR)/lib/libjxl_threads.a
enc/jxl_enc_mt_simd.js: $(CODEC_MT_SIMD_BUILD_DIR)/lib/libjxl.a $(CODEC_MT_SIMD_BUILD_DIR)/lib/libjxl_threads.a

# Compile multithreaded wrappers with -pthread.
enc/jxl_enc_mt.js enc/jxl_enc_mt_simd.js: CXXFLAGS+=-pthread

$(OUT_JS):
	$(CXX) \
		$(CXXFLAGS) \
		$(LDFLAGS) \
		-I $(CODEC_DIR) \
		-I $(CODEC_DIR)/lib \
		-I $(CODEC_DIR)/lib/include \
		-I $(CODEC_BUILD_DIR)/lib/include \
		-I $(CODEC_DIR)/third_party/highway \
		-I $(CODEC_DIR)/third_party/skcms \
		-I $(CODEC_DIR)/third_party/brunsli \
		-I $(CODEC_DIR)/third_party/brunsli/c/include \
		--bind \
		--closure 1 \
		-s ALLOW_MEMORY_GROWTH=1 \
		-s MODULARIZE=1 \
		-s TEXTDECODER=2 \
		-s ENVIRONMENT='worker' \
		-s EXPORT_ES6=1 \
		-s EXPORT_NAME="$(basename $(@F))" \
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

%/lib/libjxl.a: %/Makefile
	$(MAKE) -C $(<D) jxl-static

%/lib/libjxl_threads.a: %/Makefile
	$(MAKE) -C $(<D) jxl_threads-static

# Enable SIMD on a SIMD build.
$(CODEC_MT_SIMD_BUILD_DIR)/Makefile: CXXFLAGS+=-msimd128

%/Makefile: $(CODEC_DIR)/CMakeLists.txt
	emcmake cmake \
	$(CMAKE_FLAGS) \
	-DBUILD_SHARED_LIBS=0 \
	-DJPEGXL_ENABLE_BENCHMARK=0 \
	-DJPEGXL_ENABLE_EXAMPLES=0 \
	-DBUILD_TESTING=0 \
	-B $(@D) \
	$(<D)

$(CODEC_DIR)/CMakeLists.txt:
	mkdir -p $(@D)
	git clone $(CODEC_URL) --recursive -j`nproc` --depth 1 --branch $(CODEC_VERSION) $(@D)

clean:
	$(RM) $(OUT_JS) $(OUT_WASM) $(OUT_WORKER)
	$(MAKE) -C $(CODEC_BUILD_DIR) clean
	$(MAKE) -C $(CODEC_MT_BUILD_DIR) clean
	$(MAKE) -C $(CODEC_MT_SIMD_BUILD_DIR) clean
