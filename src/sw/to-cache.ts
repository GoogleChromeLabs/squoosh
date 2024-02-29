import { simd } from 'wasm-feature-detect';
import webpDataUrl from 'data-url:./tiny.webp';
import avifDataUrl from 'data-url:./tiny.avif';
import checkThreadsSupport from 'worker-shared/supports-wasm-threads';

// Give TypeScript the correct global.
declare var self: ServiceWorkerGlobalScope;

function subtractSets<T extends any>(set1: Set<T>, set2: Set<T>): Set<T> {
  const result = new Set(set1);
  for (const item of set2) result.delete(item);
  return result;
}

// Initial app stuff
import * as initialApp from 'entry-data:client/initial-app';
import swUrl from 'service-worker:sw';
import * as compress from 'entry-data:client/lazy-app/Compress';
import * as swBridge from 'entry-data:client/lazy-app/sw-bridge';
import * as blobAnim from 'entry-data:shared/prerendered-app/Intro/blob-anim';

// The processors and codecs
// Simple stuff everyone gets:
import * as featuresWorker from 'entry-data:../features-worker';

// Decoders (some are feature detected)
import * as avifDec from 'entry-data:codecs/avif/dec/avif_dec';
import * as webpDec from 'entry-data:codecs/webp/dec/webp_dec';

// AVIF
import * as avifEncMt from 'entry-data:codecs/avif/enc/avif_enc_mt';
import * as avifEnc from 'entry-data:codecs/avif/enc/avif_enc';

// JXL
import * as jxlEncMtSimd from 'entry-data:codecs/jxl/enc/jxl_enc_mt_simd';
import * as jxlEncMt from 'entry-data:codecs/jxl/enc/jxl_enc_mt';
import * as jxlEnc from 'entry-data:codecs/jxl/enc/jxl_enc';

// OXI
import * as oxiMt from 'entry-data:codecs/oxipng/pkg-parallel/squoosh_oxipng';
import * as oxi from 'entry-data:codecs/oxipng/pkg/squoosh_oxipng';

// WebP
import * as webpEncSimd from 'entry-data:codecs/webp/enc/webp_enc_simd';
import * as webpEnc from 'entry-data:codecs/webp/enc/webp_enc';

// WP2
import * as wp2EncMtSimd from 'entry-data:codecs/wp2/enc/wp2_enc_mt_simd';
import * as wp2EncMt from 'entry-data:codecs/wp2/enc/wp2_enc_mt';
import * as wp2Enc from 'entry-data:codecs/wp2/enc/wp2_enc';

export function shouldCacheDynamically(url: string) {
  return url.startsWith('/c/demo-');
}

let initialJs = new Set([
  compress.main,
  ...compress.deps,
  swBridge.main,
  ...swBridge.deps,
  blobAnim.main,
  ...blobAnim.deps,
]);
initialJs = subtractSets(
  initialJs,
  new Set([
    initialApp.main,
    ...initialApp.deps.filter(
      (item) =>
        // Exclude JS deps that have been inlined:
        item.endsWith('.js') ||
        // As well as large image deps we want to keep dynamic:
        shouldCacheDynamically(item),
    ),
    // Exclude features Worker itself - it's referenced from the main app,
    // but is meant to be cached lazily.
    featuresWorker.main,
    // Also exclude Service Worker itself (we're inside right now).
    swUrl,
  ]),
);

export const initial = ['/', ...initialJs];

export const theRest = (async () => {
  const [supportsThreads, supportsSimd, supportsWebP, supportsAvif] =
    await Promise.all([
      checkThreadsSupport(),
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

  const items: string[] = [];

  function addWithDeps(entry: typeof import('entry-data:*')) {
    items.push(entry.main, ...entry.deps);
  }

  addWithDeps(featuresWorker);

  if (!supportsAvif) addWithDeps(avifDec);
  if (!supportsWebP) addWithDeps(webpDec);

  // AVIF
  if (supportsThreads) {
    addWithDeps(avifEncMt);
  } else {
    addWithDeps(avifEnc);
  }

  // JXL
  if (supportsThreads && supportsSimd) {
    addWithDeps(jxlEncMtSimd);
  } else if (supportsThreads) {
    addWithDeps(jxlEncMt);
  } else {
    addWithDeps(jxlEnc);
  }

  // OXI
  if (supportsThreads) {
    addWithDeps(oxiMt);
  } else {
    addWithDeps(oxi);
  }

  // WebP
  if (supportsSimd) {
    addWithDeps(webpEncSimd);
  } else {
    addWithDeps(webpEnc);
  }

  // WP2
  if (supportsThreads && supportsSimd) {
    addWithDeps(wp2EncMtSimd);
  } else if (supportsThreads) {
    addWithDeps(wp2EncMt);
  } else {
    addWithDeps(wp2Enc);
  }

  return [...new Set(items)];
})();
