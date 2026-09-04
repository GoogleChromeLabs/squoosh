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

// AVIF
import * as avifEncMt from 'entry-data:codecs/avif/enc/avif_enc_mt';

// JXL
import * as jxlEnc from 'entry-data:codecs/jxl/enc/jxl_enc';

// OXI
import * as oxi from 'entry-data:codecs/oxipng/pkg/squoosh_oxipng';

// WebP
import * as webpEnc from 'entry-data:codecs/webp/enc/webp_enc';

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
  const items: string[] = [];

  function addWithDeps(entry: typeof import('entry-data:*')) {
    items.push(entry.main, ...entry.deps);
  }

  addWithDeps(featuresWorker);

  // AVIF
  addWithDeps(avifEncMt);

  // JXL (single SIMD + threads build)
  addWithDeps(jxlEnc);

  // OXI (single threads + SIMD build)
  addWithDeps(oxi);

  // WebP (single SIMD + threads build)
  addWithDeps(webpEnc);

  return [...new Set(items)];
})();
