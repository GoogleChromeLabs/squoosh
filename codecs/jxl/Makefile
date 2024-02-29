CODEC_URL = https://github.com/libjxl/libjxl.git
CODEC_VERSION = 9f544641ec83f6abd9da598bdd08178ee8a003e0
CODEC_DIR = node_modules/jxl
CODEC_BUILD_ROOT := $(CODEC_DIR)/build
CODEC_MT_BUILD_DIR := $(CODEC_BUILD_ROOT)/mt
CODEC_MT_SIMD_BUILD_DIR := $(CODEC_BUILD_ROOT)/mt-simd
ENVIRONMENT = worker

OUT_JS = enc/jxl_enc.js enc/jxl_enc_mt.js enc/jxl_enc_mt_simd.js dec/jxl_dec.js enc/jxl_node_enc.js dec/jxl_node_dec.js
OUT_WASM = $(OUT_JS:.js=.wasm)
OUT_WORKER = $(OUT_JS:.js=.worker.js)

.PHONY: all clean

all: $(OUT_JS)

# Define dependencies for all variations of build artifacts.
$(filter enc/%,$(OUT_JS)): enc/jxl_enc.cpp
$(filter dec/%,$(OUT_JS)): dec/jxl_dec.cpp

enc/jxl_node_enc.js dec/jxl_node_dec.js: ENVIRONMENT = node

# For single-threaded build, we compile with threads enabled, but then just don't use them nor link them in.
enc/jxl_enc.js enc/jxl_node_enc.js enc/jxl_enc_mt.js dec/jxl_dec.js dec/jxl_node_dec.js: CODEC_BUILD_DIR:=$(CODEC_MT_BUILD_DIR)
enc/jxl_enc_mt_simd.js: CODEC_BUILD_DIR:=$(CODEC_MT_SIMD_BUILD_DIR)

enc/jxl_node_enc.js dec/jxl_node_dec.js enc/jxl_enc.js dec/jxl_dec.js: $(CODEC_MT_BUILD_DIR)/lib/libjxl.a
enc/jxl_enc_mt.js: $(CODEC_MT_BUILD_DIR)/lib/libjxl.a $(CODEC_MT_BUILD_DIR)/lib/libjxl_threads.a
enc/jxl_enc_mt_simd.js: $(CODEC_MT_SIMD_BUILD_DIR)/lib/libjxl.a $(CODEC_MT_SIMD_BUILD_DIR)/lib/libjxl_threads.a

# Disable errors on deprecated SIMD intrinsics.
# JPEG-XL & Highway need to catch up, once they do, we can remove this suppression.
export CXXFLAGS += -Wno-deprecated-declarations

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
		--bind \
		-s ENVIRONMENT=$(ENVIRONMENT) \
		-s EXPORT_ES6=1 \
		-o $@ \
		$+ \
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
	-DCMAKE_CROSSCOMPILING_EMULATOR=node \
	-B $(@D) \
	$(<D)
	emcc -Wall -O3 -o $(CODEC_DIR)/third_party/skcms/skcms.cc.o -I$(CODEC_DIR)/third_party/skcms -c $(CODEC_DIR)/third_party/skcms/skcms.cc
	llvm-ar rc $(CODEC_BUILD_DIR)/third_party/libskcms.a $(CODEC_DIR)/third_party/skcms/skcms.cc.o
	rm $(CODEC_DIR)/third_party/skcms/skcms.cc.o

$(CODEC_DIR)/CMakeLists.txt:
	$(RM) -r $(@D)
	git init $(@D)
	git -C $(@D) fetch $(CODEC_URL) $(CODEC_VERSION) --depth 1
	git -C $(@D) checkout FETCH_HEAD
	git -C $(@D) submodule update --init --depth 1 --recursive --jobs `nproc`

clean:
	$(RM) $(OUT_JS) $(OUT_WASM) $(OUT_WORKER)
	$(MAKE) -C $(CODEC_BUILD_DIR) clean
	$(MAKE) -C $(CODEC_MT_BUILD_DIR) clean
	$(MAKE) -C $(CODEC_MT_SIMD_BUILD_DIR) clean
