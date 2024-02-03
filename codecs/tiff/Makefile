CODEC_URL = https://download.osgeo.org/libtiff/tiff-4.6.0.tar.xz
CODEC_PACKAGE = node_modules/tiff.tar.xz
CODEC_PACKAGE_HASH = e178649607d1e22b51cf361dd20a3753f244f022eefab1f2f218fc62ebaf87d2

ZLIB_URL = https://github.com/madler/zlib/releases/download/v1.3.1/zlib-1.3.1.tar.xz
ZLIB_PACKAGE = node_modules/zlib.tar.xz
ZLIB_PACKAGE_HASH = 38ef96b8dfe510d42707d9c781877914792541133e1870841463bfa73f883e32

JPEG_URL = https://github.com/libjpeg-turbo/libjpeg-turbo/releases/download/3.0.2/libjpeg-turbo-3.0.2.tar.gz
JPEG_PACKAGE = node_modules/libjpeg-turbo.tar.gz
JPEG_PACKAGE_HASH = c2ce515a78d91b09023773ef2770d6b0df77d674e144de80d63e0389b3a15ca6

export CODEC_DIR = node_modules/tiff
export ZLIB_DIR = node_modules/zlib
export JPEG_DIR = node_modules/jpeg

.PHONY all: clean_binary dec/tiff_dec.wasm

# ===============================================================
# zlib

$(ZLIB_PACKAGE):
	mkdir -p "$(@D)"
	curl -sSL "$(ZLIB_URL)" -o "$@"
	echo "$(ZLIB_PACKAGE_HASH)  $(ZLIB_PACKAGE)" | sha256sum -c -

$(ZLIB_DIR)/CMakeLists.txt: $(ZLIB_PACKAGE)
	mkdir -p "$(@D)"
	tar xJm --strip 1 -C "$(@D)" -f "$(ZLIB_PACKAGE)"
# remove dummy Makefile
	rm -f "$(ZLIB_DIR)/Makefile"

$(ZLIB_DIR)/Makefile: $(ZLIB_DIR)/CMakeLists.txt
	cmake -S "$(ZLIB_DIR)" -B "$(ZLIB_DIR)" \
		-DCMAKE_BUILD_TYPE=MinSizeRel \
		-DBUILD_SHARED_LIBS=OFF

ZLIB_LIB=$(ZLIB_DIR)/libz.a

$(ZLIB_LIB): $(ZLIB_DIR)/Makefile
	$(MAKE) -C "$(ZLIB_DIR)" zlibstatic
	mv -f "$(ZLIB_DIR)/libzlibstatic.a" "$(ZLIB_LIB)"

# ===============================================================
# libjpeg-turbo

$(JPEG_PACKAGE):
	mkdir -p "$(@D)"
	curl -sSL "$(JPEG_URL)" -o "$@"
	echo "$(JPEG_PACKAGE_HASH)  $(JPEG_PACKAGE)" | sha256sum -c -

$(JPEG_DIR)/CMakeLists.txt: $(JPEG_PACKAGE)
	mkdir -p "$(@D)"
	tar xzm --strip 1 -C "$(@D)" -f "$(JPEG_PACKAGE)"
	for i in ./patches/libjpeg-turbo/*.patch; do patch -d "$(@D)" -N -p1 < "$$i"; done

$(JPEG_DIR)/Makefile: $(JPEG_DIR)/CMakeLists.txt
	cmake -S "$(JPEG_DIR)" -B "$(JPEG_DIR)" \
		-DCMAKE_BUILD_TYPE=MinSizeRel \
		-DBUILD_SHARED_LIBS=OFF \
		-DENABLE_SHARED=OFF \
		-DWITH_SIMD=OFF \
		-DWITH_TURBOJPEG=OFF

JPEG_LIB=$(JPEG_DIR)/libjpeg.a

$(JPEG_LIB): $(JPEG_DIR)/Makefile
	$(MAKE) -C "$(JPEG_DIR)" jpeg-static

# ===============================================================
# libtiff

$(CODEC_PACKAGE):
	mkdir -p "$(@D)"
	curl -sSL "$(CODEC_URL)" -o "$@"
	echo "$(CODEC_PACKAGE_HASH)  $(CODEC_PACKAGE)" | sha256sum -c -

$(CODEC_DIR)/configure: $(CODEC_PACKAGE)
	mkdir -p "$(@D)"
	tar xJm --strip 1 -C "$(@D)" -f "$(CODEC_PACKAGE)"
	for i in ./patches/libtiff/*.patch; do patch -d "$(@D)" -N -p1 < "$$i"; done

# It's a huge pain telling CMake to find our custom-built libraries, use autoconf instead...
$(CODEC_DIR)/Makefile: $(CODEC_DIR)/configure
	cd $(CODEC_DIR); \
	./configure \
		--host=wasm32-wasi \
		--enable-shared=no \
		--enable-cxx=no \
		--disable-tools \
		--disable-tests \
		--disable-contrib \
		--disable-docs \
		--disable-thunder \
		--disable-next \
		--disable-mdi \
		--disable-old-jpeg \
		--disable-jbig \
		--disable-lerc \
		--disable-lzma \
		--disable-zstd \
		--disable-webp \
		--disable-sphinx \
		--with-zlib-include-dir="$(shell realpath $(ZLIB_DIR))" \
		--with-zlib-lib-dir="$(shell realpath $(ZLIB_DIR))" \
		--with-jpeg-include-dir="$(shell realpath $(JPEG_DIR))" \
		--with-jpeg-lib-dir="$(shell realpath $(JPEG_DIR))"

CODEC_LIB=$(CODEC_DIR)/libtiff/.libs/libtiff.a

$(CODEC_LIB): $(CODEC_DIR)/Makefile
	$(MAKE) -C "$(CODEC_DIR)"

# ===============================================================

dec/tiff_dec.wasm: $(ZLIB_LIB) $(JPEG_LIB) $(CODEC_LIB)
	$(CC) \
		$(CFLAGS) \
		-Wall \
		-Wextra \
		-Wconversion \
		-I"$(CODEC_DIR)/libtiff" \
		-g \
		-Wl,-z,stack-size=1048576 \
		-Wl,--fatal-warnings \
		-Wl,--no-entry \
		-Wl,--export=malloc \
		-Wl,--export=free \
		-Wl,--trace-symbol=stderr \
		-mexec-model=reactor \
		-o dec/tiff_dec.wasm \
		dec/tiff_dec.c \
		"$(CODEC_LIB)" \
		"$(JPEG_LIB)" \
		"$(ZLIB_LIB)" \
		-lm

# ===============================================================

distclean_zlib:
	rm -rf "$(ZLIB_DIR)"

distclean_jpeg:
	rm -rf "$(JPEG_DIR)"

distclean_codec:
	rm -rf "$(CODEC_DIR)"

.PHONY distclean: distclean_zlib distclean_jpeg distclean_codec

clean_jpeg:
	[ -f "$(JPEG_DIR)/Makefile" ] && $(MAKE) -C "$(JPEG_DIR)" clean

clean_codec:
	[ -f "$(CODEC_DIR)/Makefile" ] && $(MAKE) -C "$(CODEC_DIR)" clean

clean_binary:
	rm -f dec/tiff_dec.wasm

.PHONY clean: clean_binary clean_codec clean_jpeg
