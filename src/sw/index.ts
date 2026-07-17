import {
  cacheBen2Asset,
  downloadBen2Model,
  matchValidatedBen2Model,
  serveBen2ModelFromCache,
  cacheOrNetworkAndCache,
  cleanupCache,
  cacheOrNetwork,
  cacheBasics,
  cacheAdditionalProcessors,
  serveShareTarget,
} from './util';
import { get } from 'idb-keyval';
import {
  ben2AssetInventory,
  ben2Assets,
  shouldCacheDynamically,
} from './to-cache';

// Give TypeScript the correct global.
declare var self: ServiceWorkerGlobalScope;

const versionedCache = 'static-' + VERSION;
const dynamicCache = 'dynamic';
const expectedCaches = [versionedCache, dynamicCache];
const ben2ModelAssets = ben2AssetInventory.filter(
  ({ role }) => role === 'model',
);
if (ben2ModelAssets.length !== 1)
  throw new Error(`Expected one BEN2 model, found ${ben2ModelAssets.length}`);
const ben2ModelAsset = ben2ModelAssets[0];
if (
  !Number.isSafeInteger(ben2ModelAsset.bytes) ||
  (ben2ModelAsset.bytes || 0) <= 0
) {
  throw new Error('Expected an exact BEN2 model byte count');
}
const ben2ModelBytes = ben2ModelAsset.bytes!;
let ben2ModelDownload: Promise<void> | undefined;

function currentBen2ModelDownload(): Promise<void> {
  if (!ben2ModelDownload) {
    const tracked = downloadBen2Model(
      ben2ModelAsset.path,
      versionedCache,
      ben2ModelBytes,
    ).finally(() => {
      if (ben2ModelDownload === tracked) ben2ModelDownload = undefined;
    });
    ben2ModelDownload = tracked;
  }
  return ben2ModelDownload;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async function () {
      const promises = [];
      promises.push(cacheBasics(versionedCache));

      // If the user has already interacted with the app, update the codecs too.
      if (await get('user-interacted')) {
        promises.push(cacheAdditionalProcessors(versionedCache));
      }

      await Promise.all(promises);
    })(),
  );
});

self.addEventListener('activate', (event) => {
  self.clients.claim();

  event.waitUntil(
    (async function () {
      // Remove old caches.
      const promises = (await caches.keys()).map((cacheName) => {
        if (!expectedCaches.includes(cacheName))
          return caches.delete(cacheName);
      });

      await Promise.all<any>(promises);
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Don't care about other-origin URLs
  if (url.origin !== location.origin) return;

  if (url.pathname === '/editor') {
    event.respondWith(Response.redirect('/'));
    return;
  }

  if (
    url.pathname === '/' &&
    url.searchParams.has('share-target') &&
    event.request.method === 'POST'
  ) {
    serveShareTarget(event);
    return;
  }

  // We only care about GET from here on in.
  if (event.request.method !== 'GET') return;

  // The model can only be populated by the explicit SW-owned command below.
  if (url.pathname === ben2ModelAsset.path) {
    serveBen2ModelFromCache(
      event,
      ben2ModelAsset.path,
      versionedCache,
      ben2ModelBytes,
    );
    return;
  }

  // The other five BEN2 assets remain lazy after editor cache opt-in and are
  // persisted when the generated feature worker first fetches them.
  if (ben2Assets.includes(url.pathname)) {
    cacheBen2Asset(event, versionedCache);
    return;
  }

  if (shouldCacheDynamically(url.pathname)) {
    cacheOrNetworkAndCache(event, dynamicCache);
    cleanupCache(event, dynamicCache, ASSETS);
    return;
  }

  cacheOrNetwork(event);
});

self.addEventListener('message', (event) => {
  if (event.data?.action === 'ben2-download-model') {
    const port = event.ports[0];
    const respond = (response: unknown) => {
      try {
        port?.postMessage(response);
      } catch {
        // The transfer still belongs to the shared SW operation.
      }
    };
    event.waitUntil(
      (async () => {
        try {
          await currentBen2ModelDownload();
          respond({ ok: true });
        } catch {
          respond({ ok: false, error: 'model-download-failed' });
        }
      })(),
    );
    return;
  }

  if (event.data?.action === 'ben2-cache-status') {
    const port = event.ports[0];
    const respond = (response: unknown) => {
      try {
        port?.postMessage(response);
      } catch {
        // The requesting client disappeared; status remains advisory.
      }
    };
    event.waitUntil(
      (async () => {
        try {
          // CacheStorage.match with cacheName is a read-only lookup. Unlike
          // caches.open(), it cannot create an empty current-build cache.
          const entries = await Promise.all(
            ben2AssetInventory.map(async ({ role, path }) => ({
              role,
              path,
              cached:
                role === 'model'
                  ? !!(await matchValidatedBen2Model(
                      path,
                      versionedCache,
                      ben2ModelBytes,
                    ))
                  : !!(await caches.match(new URL(path, location.origin).href, {
                      cacheName: versionedCache,
                    })),
            })),
          );
          respond({ ok: true, cacheName: versionedCache, entries });
        } catch {
          respond({ ok: false, error: 'cache-status-unavailable' });
        }
      })(),
    );
    return;
  }

  switch (event.data) {
    case 'cache-all':
      event.waitUntil(cacheAdditionalProcessors(versionedCache));
      break;
    case 'skip-waiting':
      self.skipWaiting();
      break;
  }
});
