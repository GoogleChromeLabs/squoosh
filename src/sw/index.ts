import {
  cacheBen2Asset,
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

  // BEN2 remains lazy even after editor cache opt-in. Its exact immutable
  // runtime assets are persisted in the existing versioned static cache only
  // when the generated feature worker first fetches them.
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
              cached: !!(await caches.match(
                new URL(path, location.origin).href,
                { cacheName: versionedCache },
              )),
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
