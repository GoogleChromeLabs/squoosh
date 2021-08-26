/// <reference path="../../missing-types.d.ts" />

declare module 'asset-url:*' {
  const value: string;
  export default value;
}

// Somehow TS picks up definitions from the module itself
// instead of using `asset-url:*`. It is probably related to
// specifity of the module declaration and these declarations below fix it
declare module 'asset-url:../../codecs/png/pkg/squoosh_png_bg.wasm' {
  const value: string;
  export default value;
}

declare module 'asset-url:../../codecs/oxipng/pkg/squoosh_oxipng_bg.wasm' {
  const value: string;
  export default value;
}

declare module 'asset-url:../../codecs/resize/pkg/squoosh_resize_bg.wasm' {
  const value: string;
  export default value;
}

declare module 'chunk-url:../../codecs/avif/enc/avif_node_enc_mt.worker.js' {
  const value: string;
  export default value;
}

// These don't exist in NodeJS types so we're not able to use them but they are referenced in some emscripten and codec types
// Thus, we need to explicitly assign them to be `never`
// We're also not able to use the APIs that use these types
// So, if we want to use those APIs we need to supply its dependencies ourselves
// However, probably those APIs are more suited to be used in web (i.e. there can be other
// dependencies to web APIs that might not work in Node)
type RequestInfo = never;
type Response = never;
type WebGLRenderingContext = never;
type MessageEvent = never;

type BufferSource = ArrayBufferView | ArrayBuffer;
type URL = import('url').URL;
