import { threads, simd } from 'wasm-feature-detect';
import webpDataUrl from 'data-url:./tiny.webp';
import avifDataUrl from 'data-url:./tiny.avif';

// Give TypeScript the correct global.
declare var self: ServiceWorkerGlobalScope;

function subtractSets<T extends any>(set1: Set<T>, set2: Set<T>): Set<T> {
  const result = new Set(set1);
  for (const item of set2) result.delete(item);
  return result;
}

// Initial app stuff
import * as initialApp from 'entry-data:client/initial-app';
import * as compress from 'entry-data:client/lazy-app/Compress';
import * as swBridge from 'entry-data:client/lazy-app/sw-bridge';
import * as blobAnim from 'entry-data:shared/prerendered-app/Intro/blob-anim';
import logo from 'url:shared/prerendered-app/Intro/imgs/logo.svg';
import githubLogo from 'url:shared/prerendered-app/Intro/imgs/github-logo.svg';
import largePhotoIcon from 'url:shared/prerendered-app/Intro/imgs/demos/icon-demo-large-photo.jpg';
import artworkIcon from 'url:shared/prerendered-app/Intro/imgs/demos/icon-demo-artwork.jpg';
import deviceScreenIcon from 'url:shared/prerendered-app/Intro/imgs/demos/icon-demo-device-screen.jpg';
import logoIcon from 'url:shared/prerendered-app/Intro/imgs/demos/icon-demo-logo.png';
import logoWithText from 'url:shared/prerendered-app/Intro/imgs/logo-with-text.svg';

let initalJs = new Set([
  compress.main,
  ...compress.deps,
  swBridge.main,
  ...swBridge.deps,
  blobAnim.main,
  ...blobAnim.deps,
]);
// But initial app and any deps have already been inlined, so we don't need them:
initalJs = subtractSets(
  initalJs,
  new Set([initialApp.main, ...initialApp.deps]),
);

export const initial = [
  '/',
  ...initalJs,
  logo,
  githubLogo,
  largePhotoIcon,
  artworkIcon,
  deviceScreenIcon,
  logoIcon,
  logoWithText,
];

// The processors and codecs
// Simple stuff everyone gets:
import * as featuresWorker from 'entry-data:../features-worker';
import rotateWasm from 'url:codecs/rotate/rotate.wasm';
import quantWasm from 'url:codecs/imagequant/imagequant.wasm';
import resizeWasm from 'url:codecs/resize/pkg/squoosh_resize_bg.wasm';
import hqxWasm from 'url:codecs/hqx/pkg/squooshhqx_bg.wasm';
import mozjpegWasm from 'url:codecs/mozjpeg/enc/mozjpeg_enc.wasm';

// Decoders (some are feature detected)
import * as avifDec from 'entry-data:codecs/avif/dec/avif_dec';
import avifDecWasm from 'url:codecs/avif/dec/avif_dec.wasm';
import jxlDecWasm from 'url:codecs/jxl/dec/jxl_dec.wasm';
import * as webpDec from 'entry-data:codecs/webp/dec/webp_dec';
import webpDecWasm from 'url:codecs/webp/dec/webp_dec.wasm';
import wp2DecWasm from 'url:codecs/wp2/dec/wp2_dec.wasm';

// AVIF
import * as avifEncMtWorker from 'entry-data:codecs/avif/enc/avif_enc_mt.worker.js';
import * as avifEncMt from 'entry-data:codecs/avif/enc/avif_enc_mt';
import avifEncMtWasm from 'url:codecs/avif/enc/avif_enc_mt.wasm';
import avifEncWasm from 'url:codecs/avif/enc/avif_enc.wasm';
import * as avifEnc from 'entry-data:codecs/avif/enc/avif_enc.js';

// JXL
import * as jxlEncMtSimdWorker from 'entry-data:codecs/jxl/enc/jxl_enc_mt_simd.worker.js';
import * as jxlEncMtSimd from 'entry-data:codecs/jxl/enc/jxl_enc_mt_simd';
import jxlEncMtSimdWasm from 'url:codecs/jxl/enc/jxl_enc_mt_simd.wasm';
import * as jxlEncMtWorker from 'entry-data:codecs/jxl/enc/jxl_enc_mt.worker.js';
import * as jxlEncMt from 'entry-data:codecs/jxl/enc/jxl_enc_mt';
import jxlEncMtWasm from 'url:codecs/jxl/enc/jxl_enc_mt.wasm';
import jxlEncWasm from 'url:codecs/jxl/enc/jxl_enc.wasm';
import * as jxlEnc from 'entry-data:codecs/jxl/enc/jxl_enc';

// OXI
import oxiMtWasm from 'url:codecs/oxipng/pkg-parallel/squoosh_oxipng_bg.wasm';
import oxiWasm from 'url:codecs/oxipng/pkg/squoosh_oxipng_bg.wasm';

// WebP
import * as webpEncSimd from 'entry-data:codecs/webp/enc/webp_enc_simd';
import webpEncSimdWasm from 'url:codecs/webp/enc/webp_enc_simd.wasm';
import * as webpEnc from 'entry-data:codecs/webp/enc/webp_enc';
import webpEncWasm from 'url:codecs/webp/enc/webp_enc.wasm';

// WP2
import * as wp2EncMtSimdWorker from 'entry-data:codecs/wp2/enc/wp2_enc_mt_simd.worker.js';
import * as wp2EncMtSimd from 'entry-data:codecs/wp2/enc/wp2_enc_mt_simd';
import wp2EncMtSimdWasm from 'url:codecs/wp2/enc/wp2_enc_mt_simd.wasm';
import * as wp2EncMtWorker from 'entry-data:codecs/wp2/enc/wp2_enc_mt.worker.js';
import * as wp2EncMt from 'entry-data:codecs/wp2/enc/wp2_enc_mt';
import wp2EncMtWasm from 'url:codecs/wp2/enc/wp2_enc_mt.wasm';
import * as wp2Enc from 'entry-data:codecs/wp2/enc/wp2_enc';
import wp2EncWasm from 'url:codecs/wp2/enc/wp2_enc.wasm';

export const theRest = (async () => {
  const [
    supportsThreads,
    supportsSimd,
    supportsWebP,
    supportsAvif,
  ] = await Promise.all([
    threads(),
    simd(),
    ...[webpDataUrl, avifDataUrl].map(async (dataUrl) => {
      if (!self.createImageBitmap) return false;
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      return createImageBitmap(blob).then(
        () => true,
        () => false,
      );
    }),
  ]);

  const items = [
    featuresWorker.main,
    ...featuresWorker.deps,
    rotateWasm,
    quantWasm,
    resizeWasm,
    hqxWasm,
    mozjpegWasm,
    jxlDecWasm,
    wp2DecWasm,
  ];

  if (!supportsAvif) items.push(avifDec.main, ...avifDec.deps, avifDecWasm);
  if (!supportsWebP) items.push(webpDec.main, ...webpDec.deps, webpDecWasm);

  // AVIF
  if (supportsThreads) {
    items.push(
      avifEncMtWorker.main,
      ...avifEncMtWorker.deps,
      avifEncMt.main,
      ...avifEncMt.deps,
      avifEncMtWasm,
    );
  } else {
    items.push(avifEnc.main, ...avifEnc.deps, avifEncWasm);
  }

  // JXL
  if (supportsThreads && supportsSimd) {
    items.push(
      jxlEncMtSimdWorker.main,
      ...jxlEncMtSimdWorker.deps,
      jxlEncMtSimd.main,
      ...jxlEncMtSimd.deps,
      jxlEncMtSimdWasm,
    );
  } else if (supportsThreads) {
    items.push(
      jxlEncMtWorker.main,
      ...jxlEncMtWorker.deps,
      jxlEncMt.main,
      ...jxlEncMt.deps,
      jxlEncMtWasm,
    );
  } else {
    items.push(jxlEnc.main, ...jxlEnc.deps, jxlEncWasm);
  }

  // OXI
  if (supportsThreads) {
    items.push(oxiMtWasm);
  } else {
    items.push(oxiWasm);
  }

  // WebP
  if (supportsSimd) {
    items.push(webpEncSimd.main, ...webpEncSimd.deps, webpEncSimdWasm);
  } else {
    items.push(webpEnc.main, ...webpEnc.deps, webpEncWasm);
  }

  // WP2
  if (supportsThreads && supportsSimd) {
    items.push(
      wp2EncMtSimdWorker.main,
      ...wp2EncMtSimdWorker.deps,
      wp2EncMtSimd.main,
      ...wp2EncMtSimd.deps,
      wp2EncMtSimdWasm,
    );
  } else if (supportsThreads) {
    items.push(
      wp2EncMtWorker.main,
      ...wp2EncMtWorker.deps,
      wp2EncMt.main,
      ...wp2EncMt.deps,
      wp2EncMtWasm,
    );
  } else {
    items.push(wp2Enc.main, ...wp2Enc.deps, wp2EncWasm);
  }

  return [...new Set(items)];
})();
