CODEC_URL = https://github.com/google/butteraugli/archive/71b18b636b9c7d1ae0c1d3730b85b3c127eb4511.tar.gz
CODEC_DIR = node_modules/butteraugli
ENVIRONMENT = node

OUT_JS = visdif.js
OUT_WASM = $(OUT_JS:.js=.wasm)

.PHONY: all clean

all: $(OUT_JS)

%.js: visdif.cpp $(CODEC_DIR)/butteraugli/butteraugli.cc
	$(CXX) \
		-I $(CODEC_DIR) \
		${CXXFLAGS} \
		${LDFLAGS} \
		--bind \
		-s ENVIRONMENT=$(ENVIRONMENT) \
		-s EXPORT_ES6=1 \
		-o $@ \
		$+

$(CODEC_DIR)/butteraugli/butteraugli.cc: $(CODEC_DIR)

$(CODEC_DIR):
	mkdir -p $@
	curl -sL $(CODEC_URL) | tar xz --strip 1 -C $@

clean:
	$(RM) $(OUT_JS) $(OUT_WASM)
