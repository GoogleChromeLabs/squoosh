CODEC_URL = https://chromium.googlesource.com/codecs/libwebp2/+archive/413df7caeca5013fa9a51401660f7efd8572e0ae.tar.gz
CODEC_DIR = node_modules/wp2
CODEC_BUILD_ROOT := $(CODEC_DIR)/build
CODEC_BASELINE_BUILD_DIR := $(CODEC_BUILD_ROOT)/baseline
CODEC_MT_BUILD_DIR := $(CODEC_BUILD_ROOT)/mt
CODEC_MT_SIMD_BUILD_DIR := $(CODEC_BUILD_ROOT)/mt-simd
ENVIRONMENT = worker

OUT_JS = enc/wp2_enc.js enc/wp2_enc_mt.js enc/wp2_enc_mt_simd.js dec/wp2_dec.js enc/wp2_node_enc.js dec/wp2_node_dec.js
OUT_WASM := $(OUT_JS:.js=.wasm)
OUT_WORKER := $(OUT_JS:.js=.worker.js)

.PHONY: all clean

all: $(OUT_JS)

# Define dependencies for all variations of build artifacts.
$(filter enc/%,$(OUT_JS)): enc/wp2_enc.o
$(filter dec/%,$(OUT_JS)): dec/wp2_dec.o
enc/wp2_enc.js dec/wp2_dec.js enc/wp2_node_enc.js dec/wp2_node_dec.js: $(CODEC_BASELINE_BUILD_DIR)/libwebp2.a
enc/wp2_node_enc.js dec/wp2_node_dec.js: ENVIRONMENT = node
enc/wp2_enc_mt.js: $(CODEC_MT_BUILD_DIR)/libwebp2.a
enc/wp2_enc_mt_simd.js: $(CODEC_MT_SIMD_BUILD_DIR)/libwebp2.a
# Link multithreaded builds with -pthread.
enc/wp2_enc_mt.js enc/wp2_enc_mt_simd.js: LDFLAGS+=-pthread

$(OUT_JS):
	$(LD) \
		$(LDFLAGS) \
		--bind \
		-s ENVIRONMENT=$(ENVIRONMENT) \
		-s EXPORT_ES6=1 \
		-o $@ \
		$+

%.o: %.cpp $(CODEC_DIR)/CMakeLists.txt
	$(CXX) -c \
		$(CXXFLAGS) \
		-I $(CODEC_DIR) \
		-o $@ \
		$<

%/libwebp2.a: %/Makefile
	$(MAKE) -C $(@D)

# Disable threads for the single-threaded build.
$(CODEC_BASELINE_BUILD_DIR)/Makefile: CMAKE_FLAGS+=-DCMAKE_DISABLE_FIND_PACKAGE_Threads=1

# Enable SIMD on a SIMD build.
$(CODEC_MT_SIMD_BUILD_DIR)/Makefile: CMAKE_FLAGS+=-DWP2_ENABLE_SIMD=1

%/Makefile: $(CODEC_DIR)/CMakeLists.txt
	emcmake cmake \
		$(CMAKE_FLAGS) \
		-DWP2_BUILD_TESTS=0 \
		-DWP2_BUILD_EXAMPLES=0 \
		-DWP2_BUILD_EXTRAS=0 \
		-DWP2_REDUCED=1 \
		-B $(@D) \
		$(<D)

$(CODEC_DIR)/CMakeLists.txt:
	mkdir -p $(CODEC_DIR)
	curl -sL $(CODEC_URL) | tar xz -C $(CODEC_DIR)

clean:
	$(RM) $(OUT_JS) $(OUT_WASM) $(OUT_WORKER)
	$(MAKE) -C $(CODEC_BASELINE_BUILD_DIR) clean
	$(MAKE) -C $(CODEC_MT_BUILD_DIR) clean
	$(MAKE) -C $(CODEC_MT_SIMD_BUILD_DIR) clean
